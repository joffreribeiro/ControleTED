package com.controleted.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // O Capacitor não liga isso por padrão (Bridge.java só seta JS/DOM storage/etc,
        // sem useWideViewPort/loadWithOverviewMode). Sem essas duas flags, o WebView
        // ignora a <meta name="viewport"> do index.html e renderiza como se fosse
        // desktop (~980px de largura virtual), só encolhendo tudo visualmente pra caber
        // na tela — por isso a sidebar/tabelas desktop apareciam no celular em vez do
        // shell mobile (styles.css, @media max-width:768px nunca batia).
        WebSettings settings = this.getBridge().getWebView().getSettings();
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
    }
}
