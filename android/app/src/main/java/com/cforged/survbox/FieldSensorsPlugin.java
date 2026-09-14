package com.cforged.survbox;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "FieldSensors")
public class FieldSensorsPlugin extends Plugin implements SensorEventListener {
    private SensorManager manager;
    private Sensor baro;
    private Sensor temp;
    private Sensor gravity;
    private Float pressureHpa;
    private Float tempC;
    private float ax;
    private float ay;
    private float az;
    private boolean hasG;
    private long lastEmit;

    @Override
    public void load() {
        Context ctx = getContext();
        manager = (SensorManager) ctx.getSystemService(Context.SENSOR_SERVICE);
        if (manager == null) return;
        baro = manager.getDefaultSensor(Sensor.TYPE_PRESSURE);
        temp = manager.getDefaultSensor(Sensor.TYPE_AMBIENT_TEMPERATURE);
        gravity = manager.getDefaultSensor(Sensor.TYPE_GRAVITY);
        if (gravity == null) gravity = manager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
    }

    @PluginMethod
    public void start(PluginCall call) {
        if (manager == null) {
            JSObject miss = new JSObject();
            miss.put("ok", false);
            miss.put("hasBaro", false);
            miss.put("hasTemp", false);
            miss.put("hasGravity", false);
            call.resolve(miss);
            return;
        }
        if (baro != null) manager.registerListener(this, baro, SensorManager.SENSOR_DELAY_UI);
        if (temp != null) manager.registerListener(this, temp, SensorManager.SENSOR_DELAY_NORMAL);
        if (gravity != null) manager.registerListener(this, gravity, SensorManager.SENSOR_DELAY_UI);
        JSObject ret = new JSObject();
        ret.put("ok", true);
        ret.put("hasBaro", baro != null);
        ret.put("hasTemp", temp != null);
        ret.put("hasGravity", gravity != null);
        call.resolve(ret);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        if (manager != null) manager.unregisterListener(this);
        call.resolve();
    }

    @Override
    public void handleOnDestroy() {
        if (manager != null) manager.unregisterListener(this);
        super.handleOnDestroy();
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        int type = event.sensor.getType();
        if (type == Sensor.TYPE_PRESSURE) {
            pressureHpa = event.values[0];
        } else if (type == Sensor.TYPE_AMBIENT_TEMPERATURE) {
            tempC = event.values[0];
        } else if (type == Sensor.TYPE_GRAVITY || type == Sensor.TYPE_ACCELEROMETER) {
            ax = event.values[0];
            ay = event.values[1];
            az = event.values[2];
            hasG = true;
        }
        long now = System.currentTimeMillis();
        if (now - lastEmit < 120) return;
        lastEmit = now;
        JSObject data = new JSObject();
        if (pressureHpa != null) data.put("pressureHpa", pressureHpa.doubleValue());
        if (tempC != null) data.put("tempC", tempC.doubleValue());
        if (hasG) {
            data.put("ax", (double) ax);
            data.put("ay", (double) ay);
            data.put("az", (double) az);
        }
        notifyListeners("reading", data);
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {}
}
