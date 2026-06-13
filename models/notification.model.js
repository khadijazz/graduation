const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  recipientRole: {
    type: String,
    required: true,
  },
  notificationType: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  relatedEntityId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  relatedEntityType: {
    type: String,
  },
  readStatus: {
    type: String,
    enum: ["unread", "read", "UNREAD", "READ"],
    default: "unread",
  },
  isRead: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

notificationSchema.pre(['find', 'findOne', 'findOneAndUpdate', 'countDocuments', 'updateOne', 'deleteMany', 'deleteOne'], function() {
  this.setQuery(this.model.translateAliases(this.getQuery()));
});

module.exports = mongoose.model("Notification", notificationSchema);
