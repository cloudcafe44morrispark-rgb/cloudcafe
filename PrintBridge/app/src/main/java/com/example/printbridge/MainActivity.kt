package com.example.printbridge

import android.os.Bundle
import android.widget.Button
import android.widget.ScrollView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainActivity : AppCompatActivity() {

    private lateinit var tvLog: TextView
    private lateinit var scrollView: ScrollView
    private lateinit var btnStart: Button
    private lateinit var btnStop: Button
    private lateinit var btnTest: Button

    private val bridge = PrintBridge()
    private var pollJob: Job? = null
    private val POLL_INTERVAL_MS = 15_000L

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        tvLog      = findViewById(R.id.tvLog)
        scrollView = findViewById(R.id.scrollView)
        btnStart   = findViewById(R.id.btnStart)
        btnStop    = findViewById(R.id.btnStop)
        btnTest    = findViewById(R.id.btnTest)

        btnStart.setOnClickListener { startPolling() }
        btnStop.setOnClickListener  { stopPolling() }
        btnTest.setOnClickListener  {
            lifecycleScope.launch {
                log("Sending test receipt...")
                val result = withContext(Dispatchers.IO) { bridge.sendTestReceipt() }
                if (result.isSuccess) log("✓ Test receipt printed")
                else log("✗ Test failed: ${result.exceptionOrNull()}")
            }
        }

        log("Ready — tap Start to begin monitoring")
    }

    private fun startPolling() {
        if (pollJob?.isActive == true) return
        btnStart.isEnabled = false
        btnStop.isEnabled  = true
        log("=== Monitoring started ===")

        pollJob = lifecycleScope.launch {
            while (isActive) {
                bridge.pollAndPrint { msg -> runOnUiThread { log(msg) } }
                delay(POLL_INTERVAL_MS)
            }
        }
    }

    private fun stopPolling() {
        pollJob?.cancel()
        pollJob = null
        btnStart.isEnabled = true
        btnStop.isEnabled  = false
        log("=== Monitoring stopped ===")
    }

    private fun log(msg: String) {
        val time = java.text.SimpleDateFormat("HH:mm:ss", java.util.Locale.getDefault())
            .format(java.util.Date())
        tvLog.append("[$time] $msg\n")
        scrollView.post { scrollView.fullScroll(ScrollView.FOCUS_DOWN) }
    }
}