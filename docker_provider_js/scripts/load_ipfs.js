async function loadIpfs() {
  const { create } = await import("ipfs-core");
  const node = await create();
  const version = await node.version();
  const stream = node.cat("QmYG8MinmLmewgYga9ADrjFxqugchaiT8DNdqtJp7if1pp");
  const decoder = new TextDecoder();
  let data = "";
  const next = await stream.next();
  data += decoder.decode(await next.value);
  // data += decoder.decode(next.value, { stream: true });
  // for await (const chunk of stream) {
  //   console.log("data", data, chunk);
  //   data += decoder.decode(chunk, { stream: true });
  // }
  console.log(data);
  process.exit(0);
}
await loadIpfs();
