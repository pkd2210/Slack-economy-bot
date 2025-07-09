module.exports = (app) => {
    app.command('/addbalance', async ({ command, ack, respond }) => {
        await ack();
        
        await respond({
          response_type: "in_channel",
          text: "hey"
        });
      });
};
