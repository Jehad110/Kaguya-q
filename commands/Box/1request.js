class PendingCommand {
  name = "طلبات";
  author = "Kaguya Project";
  cooldowns = 60;
  description = "قم بقبول أو رفض المجموعات المعلقة في ردهة الإنتظار";
  role = "admin";
  aliases = ["pending"];

  async execute({ api, event, args }) {
    try {
      const { body, threadID, senderID } = event;
      const command = args[0];

      if (command === '-قبول' || command === '-إلغاء') {
        const selectedThreads = body
          .split(/\s+/)
          .map(Number)
          .filter((num) => !isNaN(num) && num > 0 && num <= pendingThreads[senderID].length);

        if (selectedThreads.length === 0) {
          return api.sendMessage(' ⚠️ | إختيار غير صالح المرجو إختيار رقم بعدها قبول أو إلغاء من أجل إضافتها أو إلغائها من ردهة الإنتظار.', threadID);
        }

        const acceptedThreads = [];
        const canceledThreads = [];

        for (const selectedThread of selectedThreads) {
          const index = selectedThread - 1;
          const threadInfo = pendingThreads[senderID][index];
          if (threadInfo) {
            if (threadInfo.action === 'accept') {
              acceptedThreads.push(threadInfo.threadID);
            } else if (threadInfo.action === 'cancel') {
              canceledThreads.push(threadInfo.threadID);
            }
          }
        }

        if (acceptedThreads.length > 0) {
          api.sendMessage(`المجموعات اللتي تم قبولها هي ${acceptedThreads.length} مجموعة في ردهة الإنتظار.`, threadID);
          acceptedThreads.forEach((threadID) => {
            api.sendMessage(' ✅ |تمت الموافقة على المجموعة من طرف المطور \n------------\nالبوت لا يحتاج إستخدام رمز فقط إستخدم \n------------------\nأوامر أو مساعدة لترى قائمة الأوامر \n----------------\nرابط حساب المطور : https://www.facebook.com/profile.php?id=61552107301107\n-----------------\nإذا كان هناك أي مشاكل يرحى التواصل معي\nنهاركم سعيد 🤙 ', threadID);
          });
        }

        if (canceledThreads.length > 0) {
          api.sendMessage(` ❎ | ' تم رفض ' ${canceledThreads.length} مجموعة في ردهة الإنتظار.`, threadID);
          canceledThreads.forEach((threadID) => {
            api.removeUserFromGroup(senderID, threadID);
          });
        }

        delete pendingThreads[senderID];
      } else {
        try {
          const pendingThreadsList = await getPendingThreads(api);
          if (pendingThreadsList.length > 0) {
            const pendingListMessage = generatePendingListMessage(pendingThreadsList);
            api.sendMessage(pendingListMessage, threadID);
            pendingThreads[senderID] = pendingThreadsList;
          } else {
            api.sendMessage(' [❗] |لا يوجد أي مجموعة في ردهة الإنتظار.', threadID);
          }
        } catch (error) {
          console.error(error);
          api.sendMessage(' ❌ |حدث خطأ أثناء جلب قائمة الجموعات.', threadID);
        }
      }
    } catch (err) {
      console.error(err);
      api.sendMessage(" ⚠️ |لقد حدث خطأ غير متوقع!", event.threadID);
    }
  }
}

export default new PendingCommand();

async function getPendingThreads(api) {
  const spamThreads = await api.getThreadList(100, null, ['OTHER']);
  const pendingThreads = await api.getThreadList(100, null, ['PENDING']);
  const allThreads = [...spamThreads, ...pendingThreads];
  const pendingThreadsList = allThreads
    .filter((thread) => thread.isSubscribed && thread.isGroup)
    .map((thread) => ({ threadID: thread.threadID, action: 'accept' }));
  return pendingThreadsList;
}

function generatePendingListMessage(pendingThreadsList) {
  let message = 'قائمة المجموعات في الإنتظار:\n'
    pendingThreadsList.forEach((thread, index) => {
    message += `${index + 1}. آيدي المجموعة : ${thread.threadID}\n`;
  });
  message += ' [⚠️] |من أجل أن تقبل أو ترفض مجموعة في ردهة الإنتظار, إستخدم "في_الإنتظار -قبول [الرقم]" أو "في_الإنتظار -إلغاء [الرقم]".';
  return message;
}
