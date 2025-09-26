import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogActions, Button } from '@mui/material';

const LiveStreamDialog = ({ open, deviceId, onClose }) => {
  const videoRef = useRef(null);

  const handleFullscreen = async () => {
    if (videoRef.current) {
      if (!document.fullscreenElement) {
        await videoRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogContent style={{ padding: 0 }}>
        {/* Replace url with deviceId if needed */}
        <video
          ref={videoRef}
          src={`https://your-stream-url/${deviceId}`} // placeholder
          controls
          autoPlay
          style={{ width: '100%', height: '100%' }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleFullscreen}>Fullscreen</Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default LiveStreamDialog;
