import React, { useEffect } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Slide from '@mui/material/Slide';
import soundFile from '../../../assets/NotificationSound.mp3';

function CustomSnackbar({ open, message, onClose, color }) {
  
  let snackbarColor = 'green';

  if (color === 'error') {
    snackbarColor = 'red';
  } else if (color === 'warning') {
    snackbarColor = 'orange';
  }
  useEffect(() => {
    if (open) {
      const audio = new Audio(soundFile); 
      audio.play();
    }
  }, [open]);

  return (
    <Snackbar
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right'
      }}
      open={open}
      autoHideDuration={3000}
      onClose={onClose}
      TransitionComponent={Slide}
      transitionDuration={600}
    >
      <div style={{
        backgroundColor: snackbarColor,
        color: '#fff',
        padding: '10px',
        borderRadius: '4px',
        boxShadow: '0px 3px 5px rgba(0, 0, 0, 0.2)',
      }}>
        {message}
      </div>
    </Snackbar>
  );
}

export default CustomSnackbar;
