import httpStatus from "http-status";
import { Meeting } from "../models/meetingSchema.js";

const add_to_activity = async (req, res) => {
  try {
    const { meetingCode } = req.body;
    
    // req.user was automatically provided by our middleware!
    const user_id = req.user.username; 

    if (!meetingCode) {
      return res.status(httpStatus.BAD_REQUEST).json({ message: "Meeting code is required" });
    }

    const newActivity = new Meeting({
      user_id: user_id,
      meetingCode: meetingCode,
    });

    await newActivity.save();

    res.status(httpStatus.CREATED).json({
      message: "Activity saved successfully",
      activity: newActivity,
    });
  } catch (error) {
    console.error("Error adding activity:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
  }
};

const get_all_activity = async (req, res) => {
  try {
    // req.user was automatically provided by our middleware!
    const user_id = req.user.username; 

    const activities = await Meeting.find({ user_id: user_id }).sort({ date: -1 });

    res.status(httpStatus.OK).json({
      message: "Activities retrieved successfully",
      count: activities.length,
      activities: activities,
    });
  } catch (error) {
    console.error("Error fetching activities:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
  }
};

export { add_to_activity, get_all_activity };