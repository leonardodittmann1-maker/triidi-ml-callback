package br.com.viralizastudio.mobile;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ContentValues;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.webkit.DownloadListener;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import org.json.JSONObject;
import java.io.OutputStream;
import java.util.Base64;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Android shell for the same-origin Viraliza web application.
 * No marketplace credentials are hardcoded into the APK.
 * The WebView origin, package name and signing identity stay fixed across upgrades.
 */
public final class MainActivity extends Activity {
    private static final String HOST = "leonardodittmann1-maker.github.io";
    private static final String APP_PATH = "/triidi-ml-callback/viraliza-studio/";
    private static final String HOME = "https://" + HOST + APP_PATH;
    private static final String RELEASES = "https://github.com/leonardodittmann1-maker/triidi-ml-callback/releases/download/";
    private static final int PICK_FILE = 4107;
    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private WebView view;
    private ValueCallback<Uri[]> fileCallback;
    private boolean isShowingOffline = false;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.rgb(13,17,32));
        getWindow().setNavigationBarColor(Color.rgb(13,17,32));
        view = new WebView(this);
        view.setBackgroundColor(Color.rgb(13,17,32));
        setContentView(view);
        WebSettings settings = view.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true); // User-selected import files only.
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSafeBrowsingEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(true);
        view.addJavascriptInterface(new AndroidBridge(), "ViralizaAndroid");
        view.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView webView,
                    ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                try { startActivityForResult(params.createIntent(), PICK_FILE); return true; }
                catch (ActivityNotFoundException ex) {
                    fileCallback.onReceiveValue(null); fileCallback = null;
                    show("Nenhum seletor de arquivos disponível."); return false;
                }
            }
        });
        view.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView webView, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (isAllowedAppUrl(uri)) return false;
                openExternal(uri);
                return true;
            }
            @Override public void onReceivedError(WebView webView, WebResourceRequest req, WebResourceError error) {
                if (req.isForMainFrame() && !isShowingOffline) {
                    isShowingOffline=true;
                    webView.loadUrl("file:///android_asset/offline.html");
                }
            }
            @Override public void onPageFinished(WebView webView, String url) {
                if (url.startsWith(HOME)) {
                    isShowingOffline=false;
                    installBlobDownloadListener();
                }
            }
        });
        view.setDownloadListener((url, agent, disposition, mime, length) -> {
            if (url.startsWith("https://")) openExternal(Uri.parse(url));
        });
        view.loadUrl(HOME);
    }

    private boolean isAllowedAppUrl(Uri uri) {
        return "https".equalsIgnoreCase(uri.getScheme()) && HOST.equalsIgnoreCase(uri.getHost())
            && uri.getPath()!=null && uri.getPath().startsWith(APP_PATH);
    }

    private void openExternal(Uri uri) {
        String scheme=uri.getScheme();
        if (scheme==null || !(scheme.equals("https") || scheme.equals("http") || scheme.equals("mailto") || scheme.equals("tel"))) return;
        try {startActivity(new Intent(Intent.ACTION_VIEW,uri));}
        catch (Exception ex) {show("Não foi possível abrir o link.");}
    }

    private void show(String message) {
        runOnUiThread(()->Toast.makeText(this,message,Toast.LENGTH_LONG).show());
    }

    // WebView does not reliably handle blob: download URLs; intercept user-initiated exports.
    private void installBlobDownloadListener() {
        String js = "(function(){if(window.__vsBlobBridge)return;window.__vsBlobBridge=true;" +
          "document.addEventListener('click',function(e){const a=e.target.closest('a[download]');" +
          "if(!a||!(/^(blob:|data:)/).test(a.href))return;" +
          "e.preventDefault();fetch(a.href).then(r=>r.blob()).then(b=>{if(b.size>16000000)throw Error('Arquivo muito grande');" +
          "const reader=new FileReader();reader.onload=()=>{const data=String(reader.result).split(',')[1];" +
          "ViralizaAndroid.saveExport(String(a.download||'viraliza-exportacao'),String(b.type||'application/octet-stream'),data)};" +
          "reader.readAsDataURL(b)}).catch(()=>alert('Não foi possível salvar o arquivo; tente um backup menor.'));" +
          "},true)})();";
        view.evaluateJavascript(js,null);
        view.evaluateJavascript("(function(){if(window.__vsExternalBridge)return;window.__vsExternalBridge=true;document.addEventListener('click',function(e){const a=e.target.closest('a[target=\"_blank\"]');if(a&&/^https?:/.test(a.href)){e.preventDefault();ViralizaAndroid.openSafeLink(a.href)}},true)})();",null);
    }

    public final class AndroidBridge {
        @JavascriptInterface public long getVersionCode() {
            try { return getPackageManager().getPackageInfo(getPackageName(),0).getLongVersionCode(); }
            catch (Exception ex) {return 0;}
        }
        @JavascriptInterface public void openVerifiedApk(String url) {
            if (url==null || !url.startsWith(RELEASES) || !url.toLowerCase(Locale.ROOT).endsWith(".apk")) return;
            runOnUiThread(()->openExternal(Uri.parse(url)));
        }
        @JavascriptInterface public void openSafeLink(String url) {
            try { Uri uri=Uri.parse(url); if (("https".equals(uri.getScheme()) || "http".equals(uri.getScheme())) && uri.getHost()!=null)
                runOnUiThread(()->openExternal(uri)); }catch(Exception ignored){}
        }
        @JavascriptInterface public void saveExport(String filename,String mime,String encoded) {
            if (encoded==null || encoded.length()>24000000) {show("Arquivo muito grande para exportar.");return;}
            io.execute(()->{
                try {
                    String safe=filename==null?"viraliza-backup.json":filename.replaceAll("[^\\p{L}\\p{N}._ -]","_");
                    if(safe.isBlank())safe="viraliza-exportacao";
                    byte[] data=Base64.getDecoder().decode(encoded);
                    ContentValues cv=new ContentValues();
                    cv.put(MediaStore.Downloads.DISPLAY_NAME,safe);
                    cv.put(MediaStore.Downloads.MIME_TYPE,mime==null?"application/octet-stream":mime);
                    cv.put(MediaStore.Downloads.RELATIVE_PATH,Environment.DIRECTORY_DOWNLOADS+"/Viraliza Studio");
                    cv.put(MediaStore.Downloads.IS_PENDING,1);
                    Uri out=getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI,cv);
                    if(out==null)throw new IllegalStateException("Não foi possível criar arquivo");
                    try(OutputStream stream=getContentResolver().openOutputStream(out)){
                        if(stream==null)throw new IllegalStateException("Não foi possível abrir arquivo");
                        stream.write(data);
                    }
                    cv.clear();cv.put(MediaStore.Downloads.IS_PENDING,0);
                    getContentResolver().update(out,cv,null,null);
                    show("Arquivo salvo em Downloads/Viraliza Studio");
                }catch(Exception ex){show("Falha ao exportar arquivo.");}
            });
        }
    }

    @Override protected void onActivityResult(int requestCode,int resultCode,Intent data) {
        super.onActivityResult(requestCode,resultCode,data);
        if(requestCode==PICK_FILE && fileCallback!=null){
            fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode,data));
            fileCallback=null;
        }
    }

    @Override public void onBackPressed() {
        if(view!=null && view.canGoBack()){view.goBack();return;}
        super.onBackPressed();
    }

    @Override protected void onDestroy() {
        if(fileCallback!=null){fileCallback.onReceiveValue(null);fileCallback=null;}
        if(view!=null){view.destroy();view=null;}
        io.shutdown();
        super.onDestroy();
    }
}
