import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

const DISMISSED_KEY = 'whatsNew_dismissed_version';

const UPDATES = [
  {
    id: 1,
    tag: 'New Feature',
    title: 'Dashboard Redesign',
    description:
      "We've completely overhauled the main dashboard to give you a faster, more intuitive experience. The new layout introduces a customizable widget system that lets you pin the metrics most relevant to your workflow front and center. Navigation has been restructured with a persistent sidebar, collapsible panels, and smarter grouping of related tools — reducing the number of clicks needed to reach any section. Whether you're monitoring live activity or reviewing historical data, the new dashboard adapts to how you work.",
  },
  {
    id: 2,
    tag: 'Improvement',
    title: 'Faster Report Generation',
    description:
      "Report loading times have been reduced by up to 3× across all report types. This was achieved through a combination of backend query optimisation, parallel data fetching, and an intelligent caching layer that stores intermediate results for frequently requested date ranges. Large reports that previously took 10–15 seconds to render now load in under 5 seconds on average. You'll also notice smoother pagination and faster filter application when working with high-volume datasets.",
  },
  {
    id: 3,
    tag: 'New Feature',
    title: 'Export to Excel & PDF',
    description:
      'Any data table in the application can now be exported directly to Excel (.xlsx) or PDF with a single click from the action menu. Excel exports preserve all column formatting, applied filters, and calculated fields, making them immediately usable without post-processing. PDF exports are print-optimised with automatic pagination, header/footer branding, and support for landscape layout on wide tables. Bulk exports across multiple date ranges or devices are also supported via the new batch export option in Settings.',
  },
  {
    id: 4,
    tag: 'Improvement',
    title: 'Redesigned Alerts & Notifications Center',
    description:
      'The alerts panel has been rebuilt from the ground up. You can now configure multi-condition alert rules — for example, trigger a notification only when speed exceeds a threshold and the device is outside a specific geofence simultaneously. Notification delivery has been expanded to include email, in-app, and webhook options per alert. A new alert history log lets you review all triggered events with timestamps, resolution status, and the ability to annotate or acknowledge alerts directly from the panel.',
  },
  {
    id: 5,
    tag: 'Bug Fix',
    title: 'Login Session Stability',
    description:
      'Resolved an issue where users were occasionally logged out unexpectedly after periods of inactivity, even when the "Remember me" option was selected. The root cause was a race condition in the token refresh flow that occurred when multiple browser tabs were open simultaneously. The session management logic has been rewritten to handle concurrent tab scenarios correctly, and refresh tokens are now rotated safely without interrupting active sessions.',
  },
  {
    id: 6,
    tag: 'New Feature',
    title: 'User Role & Permission Management',
    description:
      'Administrators can now define granular access roles directly from the Settings panel without needing backend intervention. Roles can be scoped to specific device groups, report types, or feature areas — giving you full control over what each team member can view or modify. Pre-built role templates (Viewer, Operator, Manager, Admin) are available as starting points, and custom roles can be cloned, edited, and assigned to individual users or entire teams. All permission changes are logged in the audit trail for compliance purposes.',
  },
];

const useStyles = makeStyles((theme) => ({
  paper: {
    overflow: 'hidden',
    minWidth: 920,
    minHeight: 580,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(1, 1, 1, 2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  headerIcon: {
    color: theme.palette.primary.main,
    fontSize: 22,
  },
  versionChip: {
    height: 20,
    fontSize: 11,
    fontWeight: 600,
    borderRadius: 4,
  },
  content: {
    padding: theme.spacing(1, 3),
    backgroundColor: theme.palette.background.default,
    maxHeight: 480,
    overflowY: 'auto',
  },
  updateRow: {
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(1.5),
    borderBottom: `1px solid ${theme.palette.divider}`,
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  bulletRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(0.6),
  },
  bullet: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    flexShrink: 0,
    backgroundColor: theme.palette.primary.main,
  },
  bulletContent: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.75),
  },
  bulletDescription: {
    paddingLeft: theme.spacing(2.5),
    lineHeight: 1.7,
  },
  tagChip: {
    height: 18,
    fontSize: 10,
    fontWeight: 600,
    borderRadius: 4,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(1, 2),
    borderTop: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
  },
  footerHint: {
    fontSize: 11,
    color: theme.palette.text.disabled,
  },
  footerActions: {
    display: 'flex',
    gap: theme.spacing(1),
  },
  backdrop: {
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
}));

const WhatsNewPopup = () => {
  const classes = useStyles();
  const [open, setOpen] = useState(false);

  const versionServer = useSelector((state) => state.session.server?.version);
  const versionApp = import.meta.env.VITE_APP_VERSION?.slice(0, -2);
  const version = versionServer || versionApp || '1.0.0';

  useEffect(() => {
    const permanentlyDismissed = localStorage.getItem(DISMISSED_KEY);
    if (permanentlyDismissed !== version) {
      setOpen(true);
    }
  }, [version]);

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, version);
    setOpen(false);
  };

  const handleGotIt = () => {
    setOpen(false);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      PaperProps={{ className: classes.paper }}
      BackdropProps={{ className: classes.backdrop }}
    >
      {/* ── Header ── */}
      <div className={classes.header}>
        <div className={classes.headerLeft}>
          <AutoAwesomeIcon className={classes.headerIcon} />
          <Typography variant="body1" fontWeight={700}>
            Whats New
          </Typography>
          <Chip
            label={`v${version}`}
            size="small"
            variant="outlined"
            className={classes.versionChip}
          />
        </div>
        <IconButton size="small" onClick={handleClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      {/* ── Update list ── */}
      <DialogContent className={classes.content}>
        {UPDATES.map((update) => (
          <Box key={update.id} className={classes.updateRow}>
            <div className={classes.bulletRow}>
              <span className={classes.bullet} />
              <div className={classes.bulletContent}>
                <Typography variant="body2" fontWeight={700} component="span">
                  {update.title}
                </Typography>
                <Chip
                  label={update.tag}
                  color="primary"
                  size="small"
                  variant="outlined"
                  className={classes.tagChip}
                />
              </div>
            </div>
            <Typography variant="body2" color="textSecondary" className={classes.bulletDescription}>
              {update.description}
            </Typography>
          </Box>
        ))}
      </DialogContent>

      {/* ── Footer ── */}
      <div className={classes.footer}>
        <Typography className={classes.footerHint}>
          Dismiss to stop seeing this. Got it! will show again next login.
        </Typography>
        <div className={classes.footerActions}>
          <Button size="small" onClick={handleDismiss} color="inherit">
            Dismiss
          </Button>
          <Button size="small" variant="contained" onClick={handleGotIt} disableElevation>
            Got it!
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default WhatsNewPopup;
