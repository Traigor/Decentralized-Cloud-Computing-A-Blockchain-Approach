async function saveIpfs() {
  const { create } = await import("ipfs-core");
  const newNode = await create();
  const writeData =
    "Hello, <My Dear Hello Friend Yeah Yeah test and test and then test again>";

  const results = await newNode.add({ content: writeData, path: "test.txt" });

  // console.log(results);
  const { cid } = results;
  console.log(cid.toString());
  // process.exit(0);
}

saveIpfs();
