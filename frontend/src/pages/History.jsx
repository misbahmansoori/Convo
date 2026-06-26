import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import withAuth from "../utils/withAuth";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import HomeIcon from "@mui/icons-material/Home";
import "../styles/history.css";

import { IconButton } from "@mui/material";
export default withAuth(HistoryComponent);

function HistoryComponent() {
  const { getHistoryOfUser } = useContext(AuthContext);

  const [meetings, setMeetings] = useState([]);

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
  }, []);

  let formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  return (
    <div className="historyContainer">
      {/* Background Blur */}
      <div className="historyBlur blurOne"></div>
      <div className="historyBlur blurTwo"></div>

      {/* Navbar */}
      <div className="historyNavbar">
        <div>
          <h1>Meeting History</h1>
          <p>Your previously joined meetings</p>
        </div>

        <IconButton className="homeButton" onClick={() => routeTo("/home")}>
          <HomeIcon />
        </IconButton>
      </div>

      {/* History Cards */}
      <div className="historyGrid">
        {meetings.length > 0 ? (
          meetings.map((meeting, index) => (
            <Card key={index} className="historyCard">
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {meeting.meetingCode}
                </Typography>

                <Typography color="text.secondary">
                  {formatDate(meeting.date)}
                </Typography>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="emptyHistory">
            <h2>No Meetings Yet</h2>
            <p>Join your first meeting to see your activity history here.</p>

            <Button variant="contained" onClick={() => routeTo("/home")}>
              Join Meeting
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
