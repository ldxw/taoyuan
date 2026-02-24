package com.games.wenzi.taoyuan;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import fi.iki.elonen.NanoHTTPD;

/**
 * 一次性存档迁移器：从旧版 http://localhost:8080 读取 localStorage，
 * 注入到 Capacitor 的 https://localhost WebView 中。
 */
public class SaveMigrator {

    private static final String TAG = "SaveMigrator";
    private static final String PREFS_NAME = "save_migration";
    private static final String KEY_DONE = "migration_done";
    private static final int OLD_PORT = 8080;

    private final Context context;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private MigrationServer server;
    private WebView hiddenWebView;
    private final ConcurrentHashMap<String, String> collectedSaves = new ConcurrentHashMap<>();
    private OnMigrationListener listener;
    private boolean finished = false;

    public interface OnMigrationListener {
        void onMigrationComplete(Map<String, String> saves);
        void onMigrationSkipped();
    }

    public SaveMigrator(Context context) {
        this.context = context;
    }

    /** 检查是否需要迁移 */
    public boolean needsMigration() {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        return !prefs.getBoolean(KEY_DONE, false);
    }

    /** 标记迁移完成 */
    private void markDone() {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit().putBoolean(KEY_DONE, true).apply();
    }

    /** 启动迁移流程 */
    public void migrate(OnMigrationListener listener) {
        this.listener = listener;

        if (!needsMigration()) {
            listener.onMigrationSkipped();
            return;
        }

        try {
            // 启动 NanoHTTPD，提供迁移页面
            server = new MigrationServer(OLD_PORT);
            server.start();
            Log.d(TAG, "迁移服务器启动在端口 " + OLD_PORT);

            // 创建隐藏 WebView 访问旧 origin
            handler.post(() -> {
                hiddenWebView = new WebView(context);
                WebSettings settings = hiddenWebView.getSettings();
                settings.setJavaScriptEnabled(true);
                settings.setDomStorageEnabled(true);

                hiddenWebView.addJavascriptInterface(new MigrationBridge(), "MigrationBridge");
                hiddenWebView.setWebViewClient(new WebViewClient() {
                    @Override
                    public void onPageFinished(WebView view, String url) {
                        Log.d(TAG, "迁移页面加载完成: " + url);
                    }

                    @Override
                    public void onReceivedError(WebView view, int errorCode,
                                                String description, String failingUrl) {
                        Log.e(TAG, "迁移页面加载失败: " + description);
                        finish(true);
                    }
                });

                hiddenWebView.loadUrl("http://localhost:" + OLD_PORT + "/migration");
            });

            // 10秒超时保护
            handler.postDelayed(() -> {
                if (!finished) {
                    Log.w(TAG, "迁移超时，跳过");
                    finish(true);
                }
            }, 10000);

        } catch (Exception e) {
            Log.e(TAG, "迁移启动失败", e);
            finish(true);
        }
    }

    /** 完成迁移并清理资源 */
    private synchronized void finish(boolean skipped) {
        if (finished) return;
        finished = true;
        cleanup();
        markDone();
        if (listener != null) {
            if (skipped || collectedSaves.isEmpty()) {
                listener.onMigrationSkipped();
            } else {
                listener.onMigrationComplete(collectedSaves);
            }
        }
    }

    /** 清理资源 */
    public void cleanup() {
        if (server != null) {
            server.stop();
            server = null;
        }
        handler.post(() -> {
            if (hiddenWebView != null) {
                hiddenWebView.destroy();
                hiddenWebView = null;
            }
        });
    }

    /** NanoHTTPD 迁移服务器，只返回一个迁移 HTML 页面 */
    private static class MigrationServer extends NanoHTTPD {
        MigrationServer(int port) {
            super(port);
        }

        @Override
        public Response serve(IHTTPSession session) {
            String html = "<!DOCTYPE html><html><body><script>"
                + "try {"
                + "  var saves = {};"
                + "  for (var i = 0; i < localStorage.length; i++) {"
                + "    var key = localStorage.key(i);"
                + "    if (key.indexOf('taoyuanxiang_save_') === 0) {"
                + "      saves[key] = localStorage.getItem(key);"
                + "    }"
                + "  }"
                + "  var keys = Object.keys(saves);"
                + "  if (keys.length === 0) {"
                + "    MigrationBridge.onNoData();"
                + "  } else {"
                + "    for (var j = 0; j < keys.length; j++) {"
                + "      MigrationBridge.onSaveData(keys[j], saves[keys[j]]);"
                + "    }"
                + "    MigrationBridge.onComplete(keys.length);"
                + "  }"
                + "} catch(e) {"
                + "  MigrationBridge.onError(e.message);"
                + "}"
                + "</script></body></html>";

            return newFixedLengthResponse(Response.Status.OK, "text/html", html);
        }
    }

    /** JS Bridge，接收旧 origin 的存档数据 */
    private class MigrationBridge {
        @JavascriptInterface
        public void onSaveData(String key, String value) {
            Log.d(TAG, "收到存档: " + key + " (" + value.length() + " 字符)");
            collectedSaves.put(key, value);
        }

        @JavascriptInterface
        public void onComplete(int count) {
            Log.d(TAG, "迁移完成，共 " + count + " 个存档");
            handler.post(() -> finish(false));
        }

        @JavascriptInterface
        public void onNoData() {
            Log.d(TAG, "旧 origin 无存档数据");
            handler.post(() -> finish(true));
        }

        @JavascriptInterface
        public void onError(String message) {
            Log.e(TAG, "迁移 JS 错误: " + message);
            handler.post(() -> finish(true));
        }
    }

    /**
     * 将收集到的存档注入到 Capacitor 的 WebView localStorage 中，然后刷新页面
     */
    public static void injectSaves(WebView webView, Map<String, String> saves) {
        if (saves == null || saves.isEmpty()) return;

        StringBuilder js = new StringBuilder("(function(){");
        for (Map.Entry<String, String> entry : saves.entrySet()) {
            String key = escapeJs(entry.getKey());
            String value = escapeJs(entry.getValue());
            js.append("localStorage.setItem('").append(key).append("','").append(value).append("');");
        }
        // 注入后刷新页面，让游戏重新读取 localStorage 加载存档
        js.append("location.reload();");
        js.append("})();");

        webView.evaluateJavascript(js.toString(), result ->
            Log.d(TAG, "存档注入完成，共 " + saves.size() + " 条，页面已刷新")
        );
    }

    /** 转义 JS 单引号字符串中的特殊字符 */
    private static String escapeJs(String s) {
        return s.replace("\\", "\\\\")
                .replace("'", "\\'")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }
}
