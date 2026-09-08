package com.rainx.app;

import android.graphics.Color;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.view.View;
import android.widget.FrameLayout;

import androidx.annotation.NonNull;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.material.bottomsheet.BottomSheetBehavior;
import com.google.android.material.bottomsheet.BottomSheetDialog;

import org.json.JSONException;

@CapacitorPlugin(name = "NativeBottomSheet")
public class RainxBottomSheetPlugin extends Plugin {
    private BottomSheetDialog dialog;
    private WebView sheetWebView;
    private boolean notifyingDismiss;

    @PluginMethod
    public void present(final PluginCall call) {
        final String html = call.getString("html", "");
        final String baseUrl = call.getString("baseUrl", "https://localhost/");
        getActivity().runOnUiThread(() -> {
            dismissSheet();
            sheetWebView = new WebView(getContext());
            WebSettings settings = sheetWebView.getSettings();
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setAllowFileAccess(true);
            settings.setAllowContentAccess(true);
            sheetWebView.setOverScrollMode(View.OVER_SCROLL_NEVER);
            sheetWebView.setBackgroundColor(Color.TRANSPARENT);
            sheetWebView.addJavascriptInterface(new SheetBridge(), "RainxNativeSheet");

            FrameLayout content = new FrameLayout(getContext());
            content.setBackgroundColor(Color.TRANSPARENT);
            int screenHeight = getContext().getResources().getDisplayMetrics().heightPixels;
            content.setMinimumHeight((int) (screenHeight * 0.94f));
            content.addView(sheetWebView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            ));

            dialog = new BottomSheetDialog(getActivity());
            dialog.setContentView(content);
            dialog.setCanceledOnTouchOutside(true);
            dialog.setOnShowListener(ignored -> configureBehavior());
            dialog.setOnDismissListener(ignored -> {
                if (!notifyingDismiss) notifyListeners("dismissed", new JSObject());
                sheetWebView = null;
                dialog = null;
            });
            dialog.show();
            if (dialog.getWindow() != null) dialog.getWindow().setDimAmount(0.55f);
            loadHtml(html, baseUrl);
            call.resolve();
        });
    }

    @PluginMethod
    public void update(final PluginCall call) {
        final String html = call.getString("html", "");
        final String baseUrl = call.getString("baseUrl", "https://localhost/");
        getActivity().runOnUiThread(() -> {
            if (sheetWebView == null) {
                call.reject("No native bottom sheet is open");
                return;
            }
            loadHtml(html, baseUrl);
            expandSheet();
            call.resolve();
        });
    }

    @PluginMethod
    public void dismiss(final PluginCall call) {
        getActivity().runOnUiThread(() -> {
            dismissSheet();
            call.resolve();
        });
    }

    private void configureBehavior() {
        if (dialog == null) return;
        android.view.View bottomSheet = dialog.findViewById(com.google.android.material.R.id.design_bottom_sheet);
        if (bottomSheet == null) return;
        bottomSheet.setBackgroundColor(Color.TRANSPARENT);
        BottomSheetBehavior<android.view.View> behavior = BottomSheetBehavior.from(bottomSheet);
        behavior.setDraggable(true);
        behavior.setHideable(true);
        behavior.setSkipCollapsed(true);
        behavior.setFitToContents(true);
        behavior.setPeekHeight(BottomSheetBehavior.PEEK_HEIGHT_AUTO);
        behavior.setState(BottomSheetBehavior.STATE_EXPANDED);
        bottomSheet.post(() -> {
            if (dialog != null) behavior.setState(BottomSheetBehavior.STATE_EXPANDED);
        });
        behavior.addBottomSheetCallback(new BottomSheetBehavior.BottomSheetCallback() {
            @Override public void onStateChanged(@NonNull android.view.View view, int newState) {
                if (newState == BottomSheetBehavior.STATE_HIDDEN && dialog != null) dialog.dismiss();
            }
            @Override public void onSlide(@NonNull android.view.View view, float slideOffset) {
                JSObject data = new JSObject();
                data.put("offset", slideOffset);
                notifyListeners("slide", data);
            }
        });
    }

    private void loadHtml(String html, String baseUrl) {
        if (sheetWebView != null) sheetWebView.loadDataWithBaseURL(baseUrl, wrapHtml(html), "text/html", "UTF-8", null);
    }

    private void updateSheet(String html, String baseUrl) {
        if (sheetWebView == null) return;
        int scrollY = sheetWebView.getScrollY();
        loadHtml(html, baseUrl);
        sheetWebView.postDelayed(() -> {
            if (sheetWebView == null) return;
            sheetWebView.scrollTo(0, scrollY);
            expandSheet();
        }, 120);
    }

    private void expandSheet() {
        if (dialog == null) return;
        android.view.View bottomSheet = dialog.findViewById(com.google.android.material.R.id.design_bottom_sheet);
        if (bottomSheet == null) return;
        BottomSheetBehavior<android.view.View> behavior = BottomSheetBehavior.from(bottomSheet);
        behavior.setState(BottomSheetBehavior.STATE_EXPANDED);
    }

    private String wrapHtml(String content) {
        return "<!doctype html><html><head><meta name=\"viewport\" content=\"width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no\"><style>html,body{margin:0;padding:0;background:transparent;width:100%;height:100%;min-height:100%;overflow-x:hidden;overscroll-behavior:none;overscroll-behavior-y:none}body{overflow-y:auto}*{box-sizing:border-box}</style></head><body>" + content + "<script>(function(){function send(type,node,value){if(!node||!node.dataset.rainxNativeNode||!window.RainxNativeSheet)return;window.RainxNativeSheet.postMessage(JSON.stringify({type:type,path:node.dataset.rainxNativeNode,value:value==null?null:value}));}document.addEventListener('click',function(e){send('click',e.target.closest('[data-rainx-native-node]'),null);},true);document.addEventListener('input',function(e){send('input',e.target.closest('[data-rainx-native-node]'),e.target.value);},true);document.addEventListener('change',function(e){send('change',e.target.closest('[data-rainx-native-node]'),e.target.value);},true);})();</script></body></html>";
    }

    private void dismissSheet() {
        if (dialog != null) dialog.dismiss();
    }

    private class SheetBridge {
        @JavascriptInterface public void postMessage(String raw) {
            try { notifyListeners("action", new JSObject(raw)); } catch (JSONException ignored) { }
        }
    }
}
