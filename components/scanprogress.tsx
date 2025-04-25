"use client"

import { useEffect, useState } from "react"

export function ScanProgress() {
  const [logs, setLogs] = useState<string[]>([])
  const [isScanning, setIsScanning] = useState(false)

  useEffect(() => {
    const source = new EventSource("/api/scan-stream") // Update this path if needed
    setIsScanning(true)

    source.onmessage = (e) => {
      if (e.data === "🎉 Scan complete.") {
        setIsScanning(false)
        source.close()
      }

      setLogs((prev) => [...prev, e.data])
    }

    source.onerror = (e) => {
      setIsScanning(false)
      setLogs((prev) => [...prev, "❌ Something went wrong."])
      source.close()
    }

    return () => source.close()
  }, [])

  return (
    <div className="p-4 bg-zinc-900 text-white rounded-xl shadow-lg font-mono text-sm space-y-1">
      {logs.length === 0 && <div>🔍 Waiting for scan to start...</div>}
      {logs.map((log, i) => (
        <div key={i}>{log}</div>
      ))}
      {isScanning && <div className="text-zinc-400 italic">Scanning...</div>}
    </div>
  )
}
