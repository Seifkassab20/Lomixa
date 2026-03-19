import React, { useEffect, useRef } from 'react';

interface JitsiMeetingProps {
  roomName: string;
  displayName: string;
  onClose: () => void;
}

export function JitsiMeeting({ roomName, displayName, onClose }: JitsiMeetingProps) {
  const jitsiContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Jitsi API script
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    
    script.onload = () => {
      if (window.JitsiMeetExternalAPI && jitsiContainerRef.current) {
        const domain = 'meet.jit.si';
        const options = {
          roomName: `MedVisitConnect_${roomName}`,
          width: '100%',
          height: '100%',
          parentNode: jitsiContainerRef.current,
          userInfo: {
            displayName: displayName
          },
          configOverwrite: {
            startWithAudioMuted: true,
            startWithVideoMuted: true
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false
          }
        };
        
        const api = new window.JitsiMeetExternalAPI(domain, options);
        
        api.addEventListener('videoConferenceLeft', () => {
          onClose();
        });
      }
    };
    
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, [roomName, displayName, onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="h-12 bg-gray-900 flex items-center justify-between px-4">
        <h3 className="text-white font-medium">MedVisit Connect Video Consultation</h3>
        <button onClick={onClose} className="text-white hover:text-red-400 font-bold">
          Close Meeting
        </button>
      </div>
      <div ref={jitsiContainerRef} className="flex-1 w-full h-full" />
    </div>
  );
}

// Add type definition for window object
declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}
