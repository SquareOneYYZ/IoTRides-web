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
    marginTop: theme.spacing(3),
    padding: theme.spacing(2, 3),
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(2, 1.5),
    },
  },
  pillWrapper: {
    width: '100%',
    borderRadius: 10,
    border: `3px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.action.hover,
    padding: theme.spacing(1.5, 2.5),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.spacing(1),
    transition: 'border-color 0.15s',
    '&:focus-within': {
      borderColor: theme.palette.primary.main,
      boxShadow: `0 0 0 3px ${theme.palette.primary.main}22`,
    },
  },
  pillWrapperError: {
    borderColor: `${theme.palette.error.main} !important`,
    boxShadow: `0 0 0 3px ${theme.palette.error.main}22 !important`,
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(2),
  },
  inputGroup: {
    display: 'flex',
    gap: theme.spacing(0.5),
  },
  otpInput: {
    width: 'clamp(28px, 8vw, 36px)',
    height: 'clamp(36px, 10vw, 44px)',
    fontSize: 'clamp(20px, 5vw, 25px)',
    fontWeight: 900,
    textAlign: 'center',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: theme.palette.text.primary,
    caretColor: theme.palette.primary.main,
  },
  dotsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(2),
  },
  dotGroup: {
    display: 'flex',
    gap: theme.spacing(1.5),
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    backgroundColor: theme.palette.primary.main,
    transition: 'background-color 0.15s, opacity 0.15s',
  },
  dotEmpty: {
    backgroundColor: theme.palette.divider,
  },
  actions: {
    padding: theme.spacing(2, 3),
    gap: theme.spacing(1),
    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column-reverse',
      padding: theme.spacing(1.5, 2),
      '& > button': { width: '100%', margin: '0 !important' },
    },
  },
  otpInputError: {
    color: theme.palette.error.main,
    caretColor: theme.palette.error.main,
  },
  dotError: {
    backgroundColor: theme.palette.error.main,
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
    if (digit && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
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

  const handleSubmit = () => onSubmit(digits.join(''));

  const handleClose = () => {
    setDigits(Array(OTP_LENGTH).fill(''));
    onClose();
  };

  const renderInputGroup = (start, end) => (
    <div className={classes.inputGroup}>
      {digits.slice(start, end).map((digit, i) => {
        const index = start + i;
        return (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            className={[
              classes.otpInput,
              error ? classes.otpInputError : ''
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
        );
      })}
    </div>
  );

  const renderDotGroup = (start, end) => (
    <div className={classes.dotGroup}>
      {digits.slice(start, end).map((digit, i) => (
        <div
          key={start + i}
          className={[
            classes.dot,
            !digit ? classes.dotEmpty : '',
            error ? classes.dotError : '',
          ].join(' ')}
        />
      ))}
    </div>
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="xs"
      BackdropProps={{ sx: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.4)' } }}
      PaperProps={{ sx: { mx: { xs: 2, sm: 4 } } }}
    >
      <DialogTitle disableTypography className={classes.title}>
        <Typography variant="h6">{t('loginTotpCode')}</Typography>
        <IconButton size="small" onClick={handleClose} style={{ color: 'inherit' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent className={classes.content}>
        <Typography variant="body2" color="textSecondary" align="center">
          Enter the 6-digit code from your authenticator app.
        </Typography>

        <Box className={[classes.pillWrapper, error ? classes.pillWrapperError : ''].join(' ')}>
          <div className={classes.inputRow}>
            {renderInputGroup(0, 3)}
            {renderInputGroup(3, 6)}
          </div>
          <div className={classes.dotsRow}>
            {renderDotGroup(0, 3)}
            {renderDotGroup(3, 6)}
          </div>
        </Box>

        {error && (
          <Typography sx={{ fontSize: ['14px'] }, { fontWeight: 600 }} variant="caption" color="error">
            Invalid or expired code. Please try again.
          </Typography>
        )}
      </DialogContent>

      <DialogActions className={classes.actions}>
        <Button onClick={handleClose} color="primary">{t('sharedCancel')}</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color={error ? 'error' : 'primary'}
          disabled={!digits.every(Boolean)}
        >
          {t('loginLogin')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OtpModal;