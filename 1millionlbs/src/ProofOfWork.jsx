import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const css = `
  .pow-overlay { position: fixed; inset: 0; background: #000; z-index: 2000; display: flex; flex-direction: column; }
  .pow-video { width: 100%; height: 100%; object-fit: cover; }
  .pow-canvas { display: none; }
  .pow-preview { width: 100%; height: 100%; object-fit: cover; }
  .pow-btn { padding: 16px 32px; border-radius: 50px; font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 16px; letter-spacing: 3px; cursor: pointer; border: none; transition: all 0.2s; }
  .pow-record-btn { background: #f43f5e; color: #fff; width: 72px; height: 72px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 4px solid #fff; box-shadow: 0 0 0 4px #f43f5e; }
  .pow-record-btn.recording { background: #fff; box-shadow: 0 0 0 4px #f43f5e; animation: pulse-record 1s ease infinite; }
  @keyframes pulse-record { 0%,100% { box-shadow: 0 0 0 4px #f43f5e; } 50% { box-shadow: 0 0 0 8px #f43f5e80; } }
  .pow-timestamp { position: absolute; bottom: 120px; left: 0; right: 0; text-align: center; font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 13px; color: rgba(255,255,255,0.7); letter-spacing: 2px; text-shadow: 0 1px 4px #000; pointer-events: none; }
`

export default function ProofOfWork({ onComplete, onCancel, setInfo }) {
  const videoRef       = useRef(null)
  const previewRef     = useRef(null)
  const canvasRef      = useRef(null)
  const mediaRecorder  = useRef(null)
  const chunksRef      = useRef([])
  const streamRef      = useRef(null)
  const timerRef       = useRef(null)

  const MAX_SECONDS = 60
  const [phase, setPhase]       = useState('camera')   // camera | preview | uploading
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed]   = useState(0)
  const [videoBlob, setVideoBlob] = useState(null)
  const [videoUrl, setVideoUrl]   = useState(null)
  const [error, setError]         = useState('')
  const [now, setNow]             = useState(new Date())

  // Tick clock for watermark display
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // Start camera on mount
  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch (err) {
      setError('Camera access denied. Please allow camera access and try again.')
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (timerRef.current) clearInterval(timerRef.current)
  }

  function startRecording() {
    if (!streamRef.current) return
    chunksRef.current = []
    const options = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? { mimeType: 'video/webm;codecs=vp9' }
      : MediaRecorder.isTypeSupported('video/webm')
      ? { mimeType: 'video/webm' }
      : {}

    const recorder = new MediaRecorder(streamRef.current, options)
    recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'video/webm' })
      const url  = URL.createObjectURL(blob)
      setVideoBlob(blob)
      setVideoUrl(url)
      setPhase('preview')
      stopCamera()
    }

    recorder.start(100)
    mediaRecorder.current = recorder
    setRecording(true)
    setElapsed(0)
    timerRef.current = setInterval(() => setElapsed(e => {
      const next = e + 1
      if (next >= MAX_SECONDS) {
        // Auto-stop at 60s
        if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
          mediaRecorder.current.stop()
          setRecording(false)
          clearInterval(timerRef.current)
        }
      }
      return next
    }), 1000)
  }

  function stopRecording() {
    if (mediaRecorder.current && recording) {
      mediaRecorder.current.stop()
      setRecording(false)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  function reRecord() {
    if (videoUrl) URL.revokeObjectURL(videoUrl)
    setVideoBlob(null)
    setVideoUrl(null)
    setElapsed(0)
    setPhase('camera')
    startCamera()
  }

  async function submitVideo() {
    if (!videoBlob) return
    setPhase('uploading')

    try {
      // Draw timestamp watermark onto a canvas snapshot for the thumbnail
      const timestamp = now.toLocaleString()
      const filename  = `proof/${Date.now()}-${Math.random().toString(36).slice(2)}.webm`

      const { data, error: uploadError } = await supabase.storage
        .from('proof-of-work')
        .upload(filename, videoBlob, { contentType: videoBlob.type || 'video/webm', upsert: false })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('proof-of-work')
        .getPublicUrl(filename)

      onComplete({ videoUrl: publicUrl, recordedAt: timestamp })
    } catch (err) {
      setError('Upload failed: ' + err.message)
      setPhase('preview')
    }
  }

  const formatTime = s => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`
  const timestampStr = now.toLocaleString('en-US', { month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit' })

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="pow-overlay">

        {/* CAMERA PHASE */}
        {phase === 'camera' && (
          <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <video ref={videoRef} className="pow-video" muted playsInline autoPlay />

            {/* Top bar */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)' }}>
              <button onClick={onCancel} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, color: '#fff', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 2, padding: '8px 16px', cursor: 'pointer' }}>
                CANCEL
              </button>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 14, color: '#fff', letterSpacing: 3, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>PROOF OF WORK</div>
                {setInfo && <div>{setInfo.muscleGroup?.toUpperCase()} · {setInfo.sets}×{setInfo.reps} @ {setInfo.weight}lbs</div>}
              </div>
              {recording && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: elapsed >= 50 ? '#dc2626' : '#f43f5e', borderRadius: 6, padding: '6px 12px', transition: 'background 0.3s' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', animation: 'pulse-record 1s ease infinite' }} />
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 14, color: '#fff', letterSpacing: 1 }}>{formatTime(elapsed)} / 1:00</span>
                  </div>
                  {elapsed >= 50 && <div style={{ fontSize: 10, color: '#fbbf24', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: 1 }}>AUTO-STOPS AT 60s</div>}
                </div>
              )}
              {!recording && <div style={{ width: 80 }} />}
            </div>

            {/* Timestamp watermark */}
            <div className="pow-timestamp">{timestampStr}</div>

            {/* Error */}
            {error && (
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'rgba(0,0,0,0.85)', border: '1px solid #f43f5e', borderRadius: 12, padding: '20px 24px', textAlign: 'center', maxWidth: 300 }}>
                <div style={{ fontSize: 13, color: '#f43f5e', marginBottom: 12 }}>{error}</div>
                <button onClick={onCancel} style={{ background: '#f43f5e', border: 'none', borderRadius: 8, color: '#fff', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 2, padding: '10px 20px', cursor: 'pointer' }}>CLOSE</button>
              </div>
            )}

            {/* Bottom controls */}
            {!error && (
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '32px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>
                <button
                  className={`pow-record-btn${recording ? ' recording' : ''}`}
                  onClick={recording ? stopRecording : startRecording}
                  style={{ cursor: 'pointer' }}>
                  {recording
                    ? <div style={{ width: 24, height: 24, background: '#f43f5e', borderRadius: 4 }} />
                    : <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f43f5e' }} />}
                </button>
                <div style={{ position: 'absolute', bottom: 44, fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 2 }}>
                  {recording ? 'TAP TO STOP' : 'TAP TO RECORD'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PREVIEW PHASE */}
        {phase === 'preview' && videoUrl && (
          <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <video ref={previewRef} src={videoUrl} className="pow-preview" controls autoPlay loop playsInline />

            {/* Timestamp burned into preview overlay */}
            <div style={{ position: 'absolute', bottom: 160, left: 0, right: 0, textAlign: 'center', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,0.8)', letterSpacing: 2, textShadow: '0 1px 4px #000', pointerEvents: 'none' }}>
              {timestampStr}
            </div>

            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '20px 24px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 16, color: '#fff', letterSpacing: 3 }}>REVIEW YOUR SET</div>
            </div>

            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px', display: 'flex', gap: 12, background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }}>
              <button onClick={reRecord}
                style={{ flex: 1, padding: '15px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: '#fff', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 15, letterSpacing: 3, cursor: 'pointer' }}>
                RE-RECORD
              </button>
              <button onClick={submitVideo}
                style={{ flex: 2, padding: '15px', background: '#84cc16', border: 'none', borderRadius: 10, color: '#000', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 15, letterSpacing: 3, cursor: 'pointer', boxShadow: '0 0 20px #84cc1650' }}>
                USE THIS TAKE
              </button>
            </div>
          </div>
        )}

        {/* UPLOADING PHASE */}
        {phase === 'uploading' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
            <div style={{ width: 56, height: 56, border: '3px solid #84cc1630', borderTop: '3px solid #84cc16', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 18, color: '#fff', letterSpacing: 3 }}>UPLOADING PROOF...</div>
            {error && <div style={{ fontSize: 13, color: '#f43f5e', maxWidth: 280, textAlign: 'center' }}>{error}</div>}
          </div>
        )}

        <canvas ref={canvasRef} className="pow-canvas" />
      </div>
    </>
  )
}
