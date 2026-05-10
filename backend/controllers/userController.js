const { getUserDirectory } = require("../models/store");

async function listUsers(_, res) {
  try {
    const directory = await getUserDirectory();
    res.status(200).json({
      success: true,
      users: directory
    });
  } catch (error) {
    console.error("Error listing users:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error retrieving users" 
    });
  }
}

module.exports = {
  listUsers
};
