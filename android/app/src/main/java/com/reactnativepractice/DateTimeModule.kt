package com.reactnativepractice

import android.provider.Settings
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Callback

class DateTimeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "DateTimeModule"
    }

    @ReactMethod
    fun isAutoTimeEnabled(successCallback: Callback) {
        try {
            val autoTimeEnabled = Settings.Global.getInt(
                reactApplicationContext.contentResolver,
                Settings.Global.AUTO_TIME
            )
            successCallback.invoke(autoTimeEnabled == 1)
        } catch (e: Settings.SettingNotFoundException) {
            successCallback.invoke(false)
        }
    }
}