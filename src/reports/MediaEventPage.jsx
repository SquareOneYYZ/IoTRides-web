import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton } from '@mui/material';
import LaunchIcon from '@mui/icons-material/Launch';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import useReportStyles from './common/useReportStyles';

const MediaEventPage = () => {
  const classes = useReportStyles();
  const navigate = useNavigate();

  const videoBlocks = [{ id: 1, url: 'https://example.com/video1.mp4' }, { id: 2, url: 'https://example.com/video2.mp4' }, { id: 3, url: 'https://example.com/video3.mp4' }, { id: 4, url: 'https://example.com/video4.mp4' }, { id: 5, url: 'https://example.com/video5.mp4' }, { id: 6, url: 'https://example.com/video6.mp4' }, { id: 7, url: 'https://example.com/video7.mp4' }, { id: 8, url: 'https://example.com/video8.mp4' }, { id: 9, url: 'https://example.com/video9.mp4' }, { id: 10, url: 'https://example.com/video10.mp4' }, { id: 11, url: 'https://example.com/video11.mp4' }, { id: 12, url: 'https://example.com/video12.mp4' }, { id: 13, url: 'https://example.com/video13.mp4' }, { id: 14, url: 'https://example.com/video14.mp4' }, { id: 15, url: 'https://example.com/video15.mp4' }, { id: 16, url: 'https://example.com/video16.mp4' }, { id: 17, url: 'https://example.com/video17.mp4' }, { id: 18, url: 'https://example.com/video18.mp4' }, { id: 19, url: 'https://example.com/video19.mp4' }, { id: 20, url: 'https://example.com/video20.mp4' }];

  const toggleFullscreen = (container) => {
    if (!document.fullscreenElement) {
      container.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const handleLaunch = (video) => {
    navigate('/reports/media/details', {
      state: { video },
    });
  };

  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'reportCombined']}>
      <div className={classes.container}>
        <div className={classes.containerMain}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gridGap: '10px',
              marginTop: '20px',
            }}
          >
            {videoBlocks.map((video) => {
              const ref = useRef(null);
              return (
                <div
                  key={video.id}
                  ref={ref}
                  style={{
                    backgroundColor: '#1e1e1e',
                    borderRadius: '8px',
                    position: 'relative',
                    aspectRatio: '16/9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <PlayCircleOutlineIcon sx={{ fontSize: 60, color: '#555' }} />
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      display: 'flex',
                      gap: '4px',
                    }}
                  >
                    <IconButton
                      size="small"
                      sx={{ color: '#fff' }}
                      onClick={() => toggleFullscreen(ref.current)}
                    >
                      <FullscreenIcon fontSize="small" />
                    </IconButton>

                    <IconButton
                      size="small"
                      sx={{ color: '#fff' }}
                      onClick={() => handleLaunch(video)}
                    >
                      <LaunchIcon fontSize="small" />
                    </IconButton>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default MediaEventPage;
