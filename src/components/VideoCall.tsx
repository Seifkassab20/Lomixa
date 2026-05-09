import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Appointment, getServerTime } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, Mic, MicOff, PhoneOff, User, Settings, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface VideoCallProps {
  appointment: Appointment;
  onClose: () => void;
}

const STUN_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export function VideoCall({ appointment, onClose }: VideoCallProps) {
  const { t } = useTranslation();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callStatus, setCallStatus] = useState<String>('connecting'); // connecting, connected, ended
  const [timeLeft, setTimeLeft] = useState<number>(0);
  
  const pc = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    startCall();
    
    // Time enforcement interval
    const timeInterval = setInterval(async () => {
      const now = await getServerTime();
      const start = new Date(appointment.startTime);
      const end = new Date(appointment.endTime);
      
      const fiveMins = 5 * 60 * 1000;
      
      if (now.getTime() < start.getTime() - fiveMins) {
        clearInterval(timeInterval);
        endCall(t('tooEarlyToJoin') || 'It is too early to join this session.');
      } else if (now.getTime() > end.getTime()) {
        clearInterval(timeInterval);
        endCall(t('sessionEnded') || 'Session انتهت');
      } else {
        setTimeLeft(Math.floor((end.getTime() - now.getTime()) / 1000));
      }
    }, 5000);

    return () => {
      clearInterval(timeInterval);
      cleanup();
    };
  }, []);

  const cleanup = () => {
    localStream?.getTracks().forEach(track => track.stop());
    pc.current?.close();
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
  };

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      pc.current = new RTCPeerConnection(STUN_SERVERS);

      // Add tracks
      stream.getTracks().forEach(track => {
        pc.current?.addTrack(track, stream);
      });

      // Handle remote tracks
      pc.current.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
        setCallStatus('connected');
      };

      // Handle ICE candidates
      pc.current.onicecandidate = (event) => {
        if (event.candidate) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'ice-candidate',
            payload: { candidate: event.candidate },
          });
        }
      };

      // Initialize Signaling Channel
      channelRef.current = supabase.channel(`call-${appointment.meetingId}`, {
        config: { broadcast: { self: false } },
      });

      channelRef.current
        .on('broadcast', { event: 'offer' }, async ({ payload }: any) => {
          if (!pc.current) return;
          await pc.current.setRemoteDescription(new RTCSessionDescription(payload.offer));
          const answer = await pc.current.createAnswer();
          await pc.current.setLocalDescription(answer);
          channelRef.current.send({
            type: 'broadcast',
            event: 'answer',
            payload: { answer },
          });
        })
        .on('broadcast', { event: 'answer' }, async ({ payload }: any) => {
          if (!pc.current) return;
          await pc.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
        })
        .on('broadcast', { event: 'ice-candidate' }, async ({ payload }: any) => {
          if (!pc.current) return;
          try {
            await pc.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } catch (e) {
            console.error("Error adding ice candidate", e);
          }
        })
        .on('broadcast', { event: 'hangup' }, () => {
          endCall('Other participant disconnected');
        })
        .subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED') {
            // Determine if I am the caller or receiver
            // In this logic, both can try to create an offer, but usually one follows
            // Let's say the first one creates an offer after a small delay
            // Or better: use user IDs to determine initiator
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.id === appointment.repUserId) { // Rep usually initiates?
               // Wait 1s to ensure other party is subscribed
               setTimeout(async () => {
                 if (pc.current?.signalingState === 'stable') {
                    const offer = await pc.current.createOffer();
                    await pc.current.setLocalDescription(offer);
                    channelRef.current.send({
                      type: 'broadcast',
                      event: 'offer',
                      payload: { offer },
                    });
                 }
               }, 1000);
            }
          }
        });

    } catch (err) {
      console.error("Failed to start call", err);
      alert("Please ensure camera and microphone access is allowed.");
    }
  };

  const endCall = (reason?: string) => {
    if (channelRef.current) {
        channelRef.current.send({ type: 'broadcast', event: 'hangup', payload: {} });
    }
    setCallStatus('ended');
    if (reason) alert(reason);
    setTimeout(onClose, 2000);
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col font-sans overflow-hidden">
      {/* Top Header */}
      <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
            <User className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm tracking-wide">SECURE CALL SESSION</h3>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              <span className={cn("inline-block w-1.5 h-1.5 rounded-full", callStatus === 'connected' ? "bg-emerald-500 animate-pulse" : "bg-amber-500")}></span>
              {callStatus}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
           {timeLeft > 0 && (
             <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 px-4 py-2 rounded-xl flex items-center gap-2">
               <Info className="h-4 w-4 text-[#39b596]" />
               <span className="text-white font-mono text-sm">{formatTime(timeLeft)}</span>
             </div>
           )}
           <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white" onClick={onClose}>
             <Settings className="h-5 w-5" />
           </Button>
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 relative bg-slate-900 group">
        {/* Remote Video (Main) */}
        <div className="absolute inset-0 flex items-center justify-center">
          {callStatus === 'connecting' && (
            <div className="text-center">
              <div className="flex justify-center mb-6">
                 <div className="relative">
                    <div className="absolute inset-0 animate-ping bg-emerald-500/20 rounded-full"></div>
                    <div className="relative h-20 w-20 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                       <User className="h-10 w-10 text-slate-500" />
                    </div>
                 </div>
              </div>
              <p className="text-slate-400 font-medium animate-pulse">Waiting for participant to join...</p>
            </div>
          )}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={cn("w-full h-full object-cover transition-opacity duration-700", remoteStream ? "opacity-100" : "opacity-0")}
          />
        </div>

        {/* Local Video (Floating) */}
        <motion.div 
          drag
          dragConstraints={{ left: 10, right: 300, top: 10, bottom: 500 }}
          className="absolute bottom-24 right-6 w-40 sm:w-56 aspect-[3/4] bg-slate-800 rounded-2xl border-2 border-slate-700/50 shadow-2xl overflow-hidden cursor-move z-20"
        >
          {isVideoOff ? (
            <div className="w-full h-full flex items-center justify-center bg-slate-800">
               <User className="h-12 w-12 text-slate-500" />
            </div>
          ) : (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
          )}
          <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white font-bold tracking-tighter uppercase">YOU</div>
        </motion.div>
      </div>

      {/* Control Bar */}
      <div className="h-28 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800/50 flex items-center justify-center gap-4 sm:gap-8 px-6 pb-2">
        <div className="flex flex-col items-center gap-1.5">
          <Button
            onClick={toggleMute}
            className={cn(
              "h-14 w-14 rounded-full transition-all duration-300",
              isMuted ? "bg-red-500 hover:bg-red-600 text-white" : "bg-slate-800 hover:bg-slate-700 text-slate-200"
            )}
          >
            {isMuted ? <MicOff /> : <Mic />}
          </Button>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{isMuted ? 'Unmute' : 'Mute'}</span>
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <Button
            onClick={toggleVideo}
            className={cn(
              "h-14 w-14 rounded-full transition-all duration-300",
              isVideoOff ? "bg-red-500 hover:bg-red-600 text-white" : "bg-slate-800 hover:bg-slate-700 text-slate-200"
            )}
          >
            {isVideoOff ? <CameraOff /> : <Camera />}
          </Button>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{isVideoOff ? 'Cam On' : 'Cam Off'}</span>
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <Button
            onClick={() => endCall()}
            className="h-16 w-16 rounded-full bg-red-600 hover:bg-red-700 hover:scale-110 active:scale-95 text-white shadow-lg shadow-red-900/40 transition-all border-4 border-slate-950"
          >
            <PhoneOff className="h-7 w-7" />
          </Button>
          <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">End Call</span>
        </div>
      </div>
      
      {/* Auto-End Overlay */}
      <AnimatePresence>
        {callStatus === 'ended' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-[110]"
          >
             <h2 className="text-3xl font-black text-white italic tracking-tighter mb-2">LOMIXA</h2>
             <p className="text-emerald-500 font-bold uppercase tracking-widest mb-10">Session انتهت</p>
             <div className="h-12 w-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
