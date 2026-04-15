import React, { useState, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, IconButton, Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import makeStyles from '@mui/styles/makeStyles';
import { useTranslation } from '../common/components/LocalizationProvider';

const useStyles = makeStyles((theme) => ({
  title: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    padding: theme.spacing(2, 3),
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.spacing(2),
    padding: theme.spacing(3),
  },
  otpContainer: {
    display: 'flex',
    gap: theme.spacing(1.5),
    justifyContent: 'center',
  },
  otpBox: {
    width: 44,
    height: 52,
    borderRadius: theme.shape.borderRadius,
    border: `3px solid ${theme.palette.divider}`,
    fontSize: 22,
    fontWeight: 600,
    textAlign: 'center',
    outline: 'none',
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    transition: 'border-color 0.15s, box-shadow 0.15s',
    caretColor: 'transparent',
    '&:hover': {
      borderColor: theme.palette.primary.light,
    },
    '&:focus': {
      borderColor: theme.palette.primary.main,
      boxShadow: `0 0 0 3px ${theme.palette.secondary.main}22`,
    },
  },
  otpBoxError: {
    borderColor: theme.palette.error.main,
    '&:focus': {
      borderColor: theme.palette.error.main,
      boxShadow: `0 0 0 3px ${theme.palette.error.main}22`,
    },
  },
  otpBoxFilled: {
    borderColor: theme.palette.primary.main,
  },
  actions: {
    padding: theme.spacing(2, 3),
    gap: theme.spacing(1),
  },
}));

const OTP_LENGTH = 6;

const OtpModal = ({ open, onClose, onSubmit, error }) => {
  const classes = useStyles();
  const t = useTranslation();
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const inputRefs = useRef([]);

  const handleChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === 'Enter' && digits.every(Boolean)) {
      handleSubmit();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const newDigits = [...digits];
    pasted.split('').forEach((char, i) => { newDigits[i] = char; });
    setDigits(newDigits);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleSubmit = () => {
    onSubmit(digits.join(''));
  };

  const handleClose = () => {
    setDigits(Array(OTP_LENGTH).fill(''));
    onClose();
  };

  const isComplete = digits.every(Boolean);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="xs"
      BackdropProps={{
        sx: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.4)' }
      }}
    >
      <DialogTitle disableTypography className={classes.title}>
        <Typography variant="h6">{t('loginTotpCode')}</Typography>
        <IconButton size="small" onClick={handleClose} style={{ color: 'inherit' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent className={classes.content}>
        <Typography variant="body2" sx={{ mt: 5 }} color="textSecondary" align="center">
          Enter the 6-digit code from your authenticator app.
        </Typography>
        <Box className={classes.otpContainer}>
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              className={[
                classes.otpBox,
                error ? classes.otpBoxError : '',
                digit && !error ? classes.otpBoxFilled : '',
              ].join(' ')}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              autoFocus={index === 0}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
            />
          ))}
        </Box>
        {error && (
          <Typography variant="caption" color="error">
            Invalid or expired code. Please try again.
          </Typography>
        )}
      </DialogContent>

      <DialogActions className={classes.actions}>
        <Button onClick={handleClose} color="primary">
          {t('sharedCancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={!isComplete}
        >
          {t('loginLogin')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OtpModal;