import AiSchedule from '../models/AiSchedule.js';

export const getMySchedules = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const { status } = req.query;
    
    let query = { user_email: userEmail };
    if (status && status !== 'all') {
      query.status = status;
    }

    const schedules = await AiSchedule.find(query).sort({ scheduled_at: -1 });
    res.status(200).json({ success: true, schedules });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getScheduleById = async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = req.user.email;

    const schedule = await AiSchedule.findOne({ _id: id, user_email: userEmail });
    if (!schedule) {
      return res.status(404).json({ success: false, error: 'Schedule not found' });
    }

    res.status(200).json({ success: true, schedule });
  } catch (error) {
    console.error('Error fetching schedule by id:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const cancelSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = req.user.email;
    
    const schedule = await AiSchedule.findOne({ _id: id, user_email: userEmail });
    if (!schedule) {
      return res.status(404).json({ success: false, error: 'Schedule not found' });
    }
    
    await AiSchedule.deleteOne({ _id: id });
    res.status(200).json({ success: true, message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateSchedule = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const { id } = req.params;
    const { scheduled_at } = req.body;
    
    const schedule = await AiSchedule.findOne({ _id: id, user_email: userEmail });
    if (!schedule) {
      return res.status(404).json({ success: false, error: 'Schedule not found' });
    }
    
    if (scheduled_at) {
      schedule.scheduled_at = new Date(scheduled_at);
      if (schedule.status !== 'pending') schedule.status = 'pending';
    }
    
    await schedule.save();
    res.json({ success: true, schedule });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

