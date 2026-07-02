export const sendOffer = async (connection, socket, id) => {
  try {
    const offer = await connection.createOffer();

    await connection.setLocalDescription(offer);

    socket.emit(
      "signal",
      id,
      JSON.stringify({
        sdp: connection.localDescription,
      })
    );
  } catch (err) {
    console.log(err);
  }
};