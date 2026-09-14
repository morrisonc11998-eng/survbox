package com.cforged.survbox;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FieldSensorsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
