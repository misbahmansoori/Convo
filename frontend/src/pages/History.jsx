import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import withAuth from "../utils/withAuth";
import Button from "@mui/material/Button";
import HomeIcon from "@mui/icons-material/Home";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import TagIcon from "@mui/icons-material/Tag";
import { IconButton, Snackbar, Alert } from "@mui/material";
import {
  formatMeetingCode,
  formatMeetingDateTime,
} from "../utils/meetingCode";
import "../styles/history.css";

export default withAuth(HistoryComponent);

function HistoryComponent() {
  const { getHistoryOfUser } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);
  const [copiedCode, setCopiedCode] = useState("");
  const routeTo = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getHistoryOfUser();
        setMeetings(history);
      } catch {
        // IMPLEMENT SNACKBAR
      }
    };

    fetchHistory();
  }, [getHistoryOfUser]);

  const handleCopy = async (code) => {
    const displayCode = formatMeetingCode(code);
    try {
      await navigator.clipboard.writeText(displayCode);
      setCopiedCode(displayCode);
    } catch {
      setCopiedCode("");
    }
  };

  const handleRejoin = (code) => {
    routeTo(`/${formatMeetingCode(code)}`);
  };

  return (
    <div className="historyContainer">
      <div className="historyBlur blurOne"></div>
      <div className="historyBlur blurTwo"></div>

      <div className="historyNavbar">
        <div>
          <h1>Meeting History</h1>
          <p>Review past meetings and rejoin with one click.</p>
        </div>

        <IconButton className="homeButton" onClick={() => routeTo("/home")}>
          <HomeIcon />
        </IconButton>
      </div>

      {meetings.length > 0 ? (
        <>
          <div className="historySummary">
            <span>{meetings.length} meeting{meetings.length !== 1 ? "s" : ""} recorded</span>
          </div>

          <div className="historyGrid">
            {meetings.map((meeting) => {
              const displayCode = formatMeetingCode(meeting.meetingCode);
              const { date, time } = formatMeetingDateTime(meeting.date);

              return (
                <article key={meeting._id || `${displayCode}-${meeting.date}`} className="historyCard">
                  <div className="historyCardTop">
                    <div className="historyCardIcon">
                      <VideoCallIcon />
                    </div>
                    <div className="historyCardMeta">
                      <span className="historyCardLabel">
                        <TagIcon fontSize="inherit" /> Meeting code
                      </span>
                      <code className="historyCode">{displayCode}</code>
                    </div>
                  </div>

                  <div className="historyCardDetails">
                    <div className="historyDetailRow">
                      <AccessTimeIcon fontSize="small" />
                      <div>
                        <strong>{date}</strong>
                        {time && <span>{time}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="historyCardActions">
                    <Button
                      variant="contained"
                      startIcon={<VideoCallIcon />}
                      onClick={() => handleRejoin(meeting.meetingCode)}
                    >
                      Rejoin
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<ContentCopyIcon />}
                      onClick={() => handleCopy(meeting.meetingCode)}
                    >
                      Copy code
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      ) : (
        <div className="emptyHistory">
          <VideoCallIcon className="emptyHistoryIcon" />
          <h2>No meetings yet</h2>
          <p>
            Create a new meeting or join with a code from the home page. Your
            activity will appear here.
          </p>
          <Button variant="contained" onClick={() => routeTo("/home")}>
            Go to Home
          </Button>
        </div>
      )}

      <Snackbar
        open={Boolean(copiedCode)}
        autoHideDuration={2500}
        onClose={() => setCopiedCode("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" variant="filled">
          Copied meeting code: {copiedCode}
        </Alert>
      </Snackbar>
    </div>
  );
}
