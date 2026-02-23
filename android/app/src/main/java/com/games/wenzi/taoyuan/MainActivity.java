package com.games.wenzi.taoyuan;

import android.graphics.Color;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private View loadingOverlay;
    private View enterButton;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private boolean loadingDismissed = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 沉浸式状态栏
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WindowInsetsControllerCompat controller = new WindowInsetsControllerCompat(getWindow(), getWindow().getDecorView());
        controller.setAppearanceLightStatusBars(false);
        getWindow().setStatusBarColor(Color.TRANSPARENT);

        // BridgeActivity 已创建自己的 WebView 布局，手动 inflate 遮罩层叠加到上面
        loadingOverlay = getLayoutInflater().inflate(R.layout.activity_main, null);
        addContentView(loadingOverlay, new ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ));

        enterButton = loadingOverlay.findViewById(R.id.enterButton);

        // 点击"进入游戏"手动关闭遮罩
        enterButton.setOnClickListener(v -> dismissLoading());

        // 5秒后如果还没加载完，显示进入按钮
        handler.postDelayed(() -> {
            if (!loadingDismissed && enterButton != null) {
                enterButton.setVisibility(View.VISIBLE);
                enterButton.setAlpha(0f);
                enterButton.animate().alpha(1f).setDuration(300).start();
            }
        }, 5000);

        // 监听 Capacitor WebView 加载完成
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.setWebViewClient(new WebViewClient() {
                @Override
                public void onPageFinished(WebView view, String url) {
                    super.onPageFinished(view, url);
                    // 注入 MutationObserver，等 Vue 渲染完 #app 后隐藏遮罩
                    view.evaluateJavascript(
                        "(function() {" +
                        "  var app = document.getElementById('app');" +
                        "  if (app && app.children.length > 0) {" +
                        "    window.dispatchEvent(new Event('appReady'));" +
                        "    return;" +
                        "  }" +
                        "  var observer = new MutationObserver(function() {" +
                        "    if (app && app.children.length > 0) {" +
                        "      observer.disconnect();" +
                        "      window.dispatchEvent(new Event('appReady'));" +
                        "    }" +
                        "  });" +
                        "  if (app) { observer.observe(app, { childList: true }); }" +
                        "})();",
                        null
                    );
                }
            });

            // 注册 JS 接口，让 WebView 可以通知 Native 隐藏遮罩
            webView.addJavascriptInterface(new Object() {
                @android.webkit.JavascriptInterface
                public void hideLoading() {
                    runOnUiThread(() -> dismissLoading());
                }
            }, "NativeApp");

            // 注入 appReady 事件监听器
            handler.postDelayed(() -> {
                WebView wv = getBridge().getWebView();
                if (wv != null) {
                    wv.evaluateJavascript(
                        "window.addEventListener('appReady', function() { NativeApp.hideLoading(); });",
                        null
                    );
                }
            }, 100);
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        handler.removeCallbacksAndMessages(null);
    }

    private void dismissLoading() {
        if (loadingDismissed || loadingOverlay == null) return;
        loadingDismissed = true;
        handler.removeCallbacksAndMessages(null);
        loadingOverlay.animate()
            .alpha(0f)
            .setDuration(300)
            .withEndAction(() -> loadingOverlay.setVisibility(View.GONE))
            .start();
    }
}
