package com.example.printbridge

import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.OutputStream
import java.net.HttpURLConnection
import java.net.Socket
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

class PrintBridge {

    companion object {
        private const val SUPABASE_URL = "https://jsldrmudlqtwffwtrcwh.supabase.co"
        private const val ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzbGRybXVkbHF0d2Zmd3RyY3doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MDEwNDIsImV4cCI6MjA4MzM3NzA0Mn0.T5YIhRCO563hTHtn17xXxPz88TEoLyZI01yfYgQ3Pa0"
        private const val PRINTER_HOST = "192.168.32.115"
        private const val PRINTER_PORT = 9100
        private const val TAG = "PrintBridge"
    }

    private val isoFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
        timeZone = TimeZone.getTimeZone("UTC")
    }
    private val displayFormat = SimpleDateFormat("HH:mm dd/MM", Locale.getDefault())

    // ─── HTTP helpers ─────────────────────────────────────────────────────────

    private fun get(path: String): JSONArray {
        val url = URL("$SUPABASE_URL/rest/v1/$path")
        val conn = (url.openConnection() as HttpURLConnection).apply {
            requestMethod = "GET"
            setRequestProperty("apikey", ANON_KEY)
            setRequestProperty("Authorization", "Bearer $ANON_KEY")
            setRequestProperty("Accept", "application/json")
            connectTimeout = 10000
            readTimeout = 10000
        }
        val code = conn.responseCode
        val body = conn.inputStream.bufferedReader().readText()
        conn.disconnect()
        if (code != 200) throw RuntimeException("GET $path failed $code: $body")
        return JSONArray(body)
    }

    private fun patch(path: String, json: JSONObject) {
        val url = URL("$SUPABASE_URL/rest/v1/$path")
        val conn = (url.openConnection() as HttpURLConnection).apply {
            requestMethod = "PATCH"
            setRequestProperty("apikey", ANON_KEY)
            setRequestProperty("Authorization", "Bearer $ANON_KEY")
            setRequestProperty("Content-Type", "application/json")
            setRequestProperty("Prefer", "return=minimal")
            doOutput = true
            connectTimeout = 10000
            readTimeout = 10000
        }
        conn.outputStream.bufferedWriter().use { it.write(json.toString()) }
        val code = conn.responseCode
        conn.disconnect()
        if (code !in 200..299) throw RuntimeException("PATCH $path failed $code")
    }

    // ─── Main poll loop ───────────────────────────────────────────────────────

    suspend fun pollAndPrint(onStatus: (String) -> Unit) = withContext(Dispatchers.IO) {
        try {
            val since = System.currentTimeMillis() - 24 * 60 * 60 * 1000
            val sinceIso = isoFormat.format(Date(since))
            val orders = get(
                "orders?select=id,status,total,notes,created_at,pickup_time,printed_at,customer_name" +
                "&printed_at=is.null" +
                "&payment_status=eq.authorized" +
                "&created_at=gte.$sinceIso" +
                "&order=created_at.asc"
            )
            if (orders.length() == 0) {
                onStatus("No new orders")
                return@withContext
            }
            for (i in 0 until orders.length()) {
                val order = orders.getJSONObject(i)
                val orderId = order.getString("id")
                val shortId = orderId.take(8)
                onStatus("Processing order #$shortId")
                try {
                    val items = get(
                        "order_items?select=product_name,quantity,price" +
                        "&order_id=eq.$orderId"
                    )
                    val createdAtStr = order.optString("created_at", "")
                    val createdAt = runCatching { isoFormat.parse(createdAtStr)?.time }
                        .getOrNull() ?: System.currentTimeMillis()
                    val pickupMinutes = if (order.isNull("pickup_time")) 25
                                        else order.getInt("pickup_time")
                    val pickupAt = createdAt + pickupMinutes * 60 * 1000
                    val orderTimeStr = displayFormat.format(Date(createdAt))
                    val pickupStr = displayFormat.format(Date(pickupAt))
                    val customerName = order.optString("customer_name", "Customer").ifBlank { "Customer" }
                    val lines = mutableListOf<String>()
                    for (j in 0 until items.length()) {
                        val item = items.getJSONObject(j)
                        val name = item.getString("product_name")
                        val qty = item.getInt("quantity")
                        lines.add("$qty x $name")
                    }
                    val total = "£${"%.2f".format(order.getDouble("total"))}"
                    val notes = order.optString("notes", "").ifBlank { null }
                    onStatus("Printing #$shortId...")
                    printBothReceipts(
                        orderShortId = shortId,
                        orderTime = orderTimeStr,
                        pickupTime = pickupStr,
                        customerName = customerName,
                        lines = lines,
                        notes = notes,
                        total = total,
                        items = items
                    )
                    patch(
                        "orders?id=eq.$orderId",
                        JSONObject().put("printed_at", isoFormat.format(Date()))
                    )
                    onStatus("✓ #$shortId done")
                    Log.i(TAG, "Printed order $orderId")
                } catch (e: Exception) {
                    val msg = "✗ #$shortId failed: ${e.message}"
                    onStatus(msg)
                    Log.e(TAG, msg, e)
                }
            }
        } catch (e: Exception) {
            val msg = "Query failed: ${e.message}"
            onStatus(msg)
            Log.e(TAG, msg, e)
        }
    }

    // ─── Print both receipts ──────────────────────────────────────────────────

    private fun printBothReceipts(
        orderShortId: String,
        orderTime: String,
        pickupTime: String,
        customerName: String,
        lines: List<String>,
        notes: String?,
        total: String,
        items: JSONArray
    ) {
        Socket(PRINTER_HOST, PRINTER_PORT).use { socket ->
            socket.soTimeout = 10000
            val out: OutputStream = socket.getOutputStream()
            // 第一联：厨房单
            writeKitchenReceipt(out, orderShortId, orderTime, pickupTime, customerName, lines, notes)
            // 第二联：顾客单
            writeCustomerReceipt(out, orderShortId, orderTime, pickupTime, customerName, items, notes, total)
            out.flush()
        }
    }

    fun sendTestReceipt(): Result<Unit> = runCatching {
        Socket(PRINTER_HOST, PRINTER_PORT).use { socket ->
            socket.soTimeout = 5000
            val out = socket.getOutputStream()
            val testItems = JSONArray().apply {
                put(JSONObject().apply {
                    put("product_name", "Latte")
                    put("quantity", 1)
                    put("price", 3.50)
                })
                put(JSONObject().apply {
                    put("product_name", "Croissant")
                    put("quantity", 2)
                    put("price", 2.50)
                })
            }
            writeKitchenReceipt(out, "TEST1234", "12:00 01/01", "12:25 01/01",
                "Test Customer", listOf("1 x Latte", "2 x Croissant"), "Extra hot")
            writeCustomerReceipt(out, "TEST1234", "12:00 01/01", "12:25 01/01",
                "Test Customer", testItems, "Extra hot", "£8.50")
            out.flush()
        }
    }

    // ─── ESC/POS: 厨房单 ──────────────────────────────────────────────────────

    private fun writeKitchenReceipt(
        out: OutputStream,
        orderShortId: String,
        orderTime: String,
        pickupTime: String,
        customerName: String,
        lines: List<String>,
        notes: String?
    ) {
        val ESC = 0x1B.toByte()
        val GS  = 0x1D.toByte()
        fun init()        = out.write(byteArrayOf(ESC, 0x40))
        fun alignCenter() = out.write(byteArrayOf(ESC, 0x61, 0x01))
        fun alignLeft()   = out.write(byteArrayOf(ESC, 0x61, 0x00))
        fun bold(on: Boolean) = out.write(byteArrayOf(ESC, 0x45, if (on) 0x01 else 0x00))
        fun bigText(on: Boolean) = out.write(
            if (on) byteArrayOf(GS, 0x21, 0x11) else byteArrayOf(GS, 0x21, 0x00)
        )
        fun println(text: String = "") = out.write("$text\n".toByteArray(Charsets.UTF_8))
        fun divider() = println("--------------------------------")
        fun cut() = out.write(byteArrayOf(GS, 0x56, 0x42, 0x00))

        init()
        alignCenter()
        bold(true)
        println("** KITCHEN **")
        bold(false)
        println()
        bold(true)
        bigText(true)
        println(customerName)
        bigText(false)
        bold(false)
        println()
        println("Order: $orderShortId")
        println("Time:  $orderTime")
        bold(true)
        println("Pickup: $pickupTime")
        bold(false)
        alignLeft()
        divider()
        bold(true)
        for (line in lines) println(line)
        bold(false)
        if (!notes.isNullOrBlank()) {
            divider()
            bold(true)
            println("NOTE: $notes")
            bold(false)
        }
        divider()
        println()
        println()
        cut()
    }

    // ─── ESC/POS: 顾客单 ──────────────────────────────────────────────────────

    private fun writeCustomerReceipt(
        out: OutputStream,
        orderShortId: String,
        orderTime: String,
        pickupTime: String,
        customerName: String,
        items: JSONArray,
        notes: String?,
        total: String
    ) {
        val ESC = 0x1B.toByte()
        val GS  = 0x1D.toByte()
        fun init()        = out.write(byteArrayOf(ESC, 0x40))
        fun alignCenter() = out.write(byteArrayOf(ESC, 0x61, 0x01))
        fun alignLeft()   = out.write(byteArrayOf(ESC, 0x61, 0x00))
        fun bold(on: Boolean) = out.write(byteArrayOf(ESC, 0x45, if (on) 0x01 else 0x00))
        fun bigText(on: Boolean) = out.write(
            if (on) byteArrayOf(GS, 0x21, 0x11) else byteArrayOf(GS, 0x21, 0x00)
        )
        fun println(text: String = "") = out.write("$text\n".toByteArray(Charsets.UTF_8))
        fun divider() = println("--------------------------------")
        fun cut() = out.write(byteArrayOf(GS, 0x56, 0x42, 0x00))

        init()
        alignCenter()
        bold(true)
        bigText(true)
        println("Cloud Cafe")
        println("Online")
        bigText(false)
        bold(false)
        println()
        bold(true)
        println(customerName)
        bold(false)
        println("Order: #$orderShortId")
        println("Ordered: $orderTime")
        bold(true)
        println("Pickup:  $pickupTime")
        bold(false)
        alignLeft()
        divider()
        for (j in 0 until items.length()) {
            val item = items.getJSONObject(j)
            val name = item.getString("product_name")
            val qty = item.getInt("quantity")
            val price = item.getDouble("price")
            val lineTotal = "£${"%.2f".format(qty * price)}"
            val left = "$qty x $name"
            val spaces = (32 - left.length - lineTotal.length).coerceAtLeast(1)
            println(left + " ".repeat(spaces) + lineTotal)
        }
        divider()
        bold(true)
        val totalLabel = "TOTAL:"
        val spaces = (32 - totalLabel.length - total.length).coerceAtLeast(1)
        println(totalLabel + " ".repeat(spaces) + total)
        bold(false)
        if (!notes.isNullOrBlank()) {
            divider()
            println("Note: $notes")
        }
        divider()
        alignCenter()
        println("Thank you!")
        println("Cloud Cafe, Morris Park")
        println("37 Rosyth Road, Glasgow")
        println()
        println()
        cut()
    }
}
