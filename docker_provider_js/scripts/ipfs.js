async function loadIpfs() {
  const { create } = await import("ipfs-core");

  const node = await create();

  const stream = node.cat("QmYG8MinmLmewgYga9ADrjFxqugchaiT8DNdqtJp7if1pp");
  const decoder = new TextDecoder();
  let data = "";

  for await (const chunk of stream) {
    data += decoder.decode(chunk, { stream: true });
  }
  console.log(data);

  const writeData = "Hello, <My Dear Hello Friend Yeah Yeah>";

  const results = await node.add(writeData);

  console.log(results);
  const { cid } = results;
  console.log(cid.toString());
}

loadIpfs();
