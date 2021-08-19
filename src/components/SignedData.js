import { useState, useEffect } from "react";
import { Container, Button, FormControl } from "@material-ui/core";
import Web3 from "web3";
import { splitSignature } from "@ethersproject/bytes";
import { useWeb3React } from "@web3-react/core";
import {
  ABI_CRAFTING,
  ABI_DELIVERY,
  ABI_KAWAII_CORE,
  ABI_KAWAII_TOKEN,
  ABI_REPLY,
  ABI_MINTING,
} from "../abi";
import axios from "axios";

const DELIVERY_ADDRESS = "0x2aC6F8D59808bB6b4c7638e4C787830579A989Ae";
const CRAFTING_ADDRESS = "0xf5783a5f3AfA61aA6B5331b3657ce7029791878D";
const MINTING_ADDRESS = "0xec740a3e94559d77EEb22212D83D13d841d51009";
const PROXY_ADDRESS = "0x2c9579F196D97a3AEF6C47F9bae239424774E3E3";
const KAWAIICORE_ADDRESS = "0x3CeadA8fc3445E413dA3715ee00D67c954602A01";
const KAWAIITOKEN_ADDRESS = "0x9Fe018C7c1a8B3bd71d148f160E047B70AaE709d";

const name = "KawaiiCrafting";
const CHAIN_ID = 97;
const RPC_URL_97 = "https://data-seed-prebsc-1-s2.binance.org:8545";
const account = "0x08aB6eA3951650F973dF9dF4ABA1a3a7bB18660E";
const privateKey =
  "8438031b7f3abc7a38bb69a53a260d590bdfee87dc8aafcac9aae6a18f2e2d7e";
let dateNow = Date.now();

const SignedData = () => {
  const [adminSignedData, setAdminSignedData] = useState("");
  const [adminSignedDataDelivery, setAdminSignedDataDelivery] = useState("");
  const [adminSignedDataMinting, setAdminSignedDataMinting] = useState("");

  const { library } = useWeb3React();

  const read = async (method, address, abi, params) => {
    const web3 = new Web3(RPC_URL_97);
    const contract = new web3.eth.Contract(abi, address);
    const res = await contract.methods[method](...params).call();
    return res;
  };

  const write = async (
    method,
    provider,
    address,
    abi,
    account,
    params,
    callback,
    value = 0
  ) => {
    const web3 = new Web3(provider);
    const contract = new web3.eth.Contract(abi, address);
    console.log(contract);
    let response, sendObj;
    if (value > 0) sendObj = { from: account, value: value };
    else sendObj = { from: account };
    await contract.methods[method](...params)
      .send(sendObj)
      .on("transactionHash", (hash) => {
        if (callback) {
          callback(hash);
        }
      })
      .on("receipt", (receipt) => {
        response = receipt;
      });
    return response;
  };

  const requestSign = async (formData) => {
    const res = await axios.post(
      "http://139.59.245.5:9000/v0/kawaii_sign",
      formData
    );
    return res.data;
  };

  const handleApprove = async (address) => {
    const web3 = new Web3(RPC_URL_97);
    await write(
      "approve",
      library.provider,
      KAWAIITOKEN_ADDRESS,
      ABI_KAWAII_TOKEN,
      account,
      [address, web3.utils.toWei("8000", "ether")],
      (hash) => console.log(hash)
    );
  };

  const handleApproveAll = async (address) => {
    await write(
      "setApprovalForAll",
      library.provider,
      KAWAIICORE_ADDRESS,
      ABI_KAWAII_CORE,
      account,
      [address, true],
      (hash) => console.log(hash)
    );
  };

  const handleAdminSignedCrafting = async () => {
    const web3 = new Web3(RPC_URL_97);

    // let functionName =
    //   "craftingItem(address,uint256[],uint256[],uint256[],uint256[],uint256,uint256,address,bytes,uint8,bytes32,bytes32)";
    // let callFunctionId = await web3.eth.abi.encodeFunctionSignature(
    //   functionName
    // );

    let callFunctionId = "0xe092018c";

    console.log(callFunctionId);

    const type = [
      "address",
      "bytes4",
      "address",
      "uint256[]",
      "uint256[]",
      "uint256[]",
      "uint256[]",
      "uint256",
      "uint256",
    ];

    const data = [
      CRAFTING_ADDRESS,
      callFunctionId,
      KAWAIICORE_ADDRESS,
      ["1", "2", "3"],
      [5, 8, 9],
      [4, 5, 6],
      [5, 8, 9],
      web3.utils.toWei("8000", "ether"),
      dateNow,
    ];

    let encodehash = await web3.utils.soliditySha3(
      await web3.eth.abi.encodeParameters(type, data)
    );

    const sign = await web3.eth.accounts.sign(
      encodehash,
      "8438031b7f3abc7a38bb69a53a260d590bdfee87dc8aafcac9aae6a18f2e2d7e"
    );

    const res = await requestSign({
      data,
      type,
      v: sign.v,
      r: sign.r,
      s: sign.s,
    });

    const vrsAdminData = await web3.eth.abi.encodeParameters(
      ["uint8", "bytes32", "bytes32"],
      [res.v, res.r, res.s]
    );
    alert(`ký thành công: ${vrsAdminData}`);
    setAdminSignedData(vrsAdminData);
  };

  const handleUserSignedCrafting = async () => {
    const nonce = await read("nonces", CRAFTING_ADDRESS, ABI_CRAFTING, [
      account,
    ]);
    const web3 = new Web3(RPC_URL_97);
    const msgParams = JSON.stringify({
      domain: {
        chainId: CHAIN_ID,
        name,
        verifyingContract: CRAFTING_ADDRESS,
        version: "1",
      },
      message: {
        adminSignedData,
        nonce,
      },
      primaryType: "Data",
      types: {
        EIP712Domain: [
          { name: "name", type: "string" },
          { name: "version", type: "string" },
          { name: "chainId", type: "uint256" },
          { name: "verifyingContract", type: "address" },
        ],
        Data: [
          { name: "adminSignedData", type: "bytes" },
          { name: "nonce", type: "uint256" },
        ],
      },
    });

    var params = [account, msgParams];
    var method = "eth_signTypedData_v4";

    const res = await library.provider.send(method, params);
    const sign = splitSignature(res.result);

    await write(
      "craftingItem",
      library.provider,
      PROXY_ADDRESS,
      ABI_REPLY,
      account,
      [
        CRAFTING_ADDRESS,
        web3.eth.abi.encodeParameters(
          [
            "address",
            "uint256[]",
            "uint256[]",
            "uint256[]",
            "uint256[]",
            "uint256",
            "uint256",
            "address",
            "bytes",
            "uint8",
            "bytes32",
            "bytes32",
          ],
          [
            KAWAIICORE_ADDRESS,
            ["1", "2", "3"],
            [5, 8, 9],
            [4, 5, 6],
            [5, 8, 9],
            web3.utils.toWei("8000", "ether"),
            dateNow,
            account,
            adminSignedData,
            sign.v,
            sign.r,
            sign.s,
          ]
        ),
      ],
      (hash) => console.log(hash)
    );
  };

  const handleAdminSignedDelivery = async () => {
    const web3 = new Web3(RPC_URL_97);

    let functionName =
      "delivery(address,uint256[],uint256[],uint256[],uint256,address,bytes,uint8,bytes32,bytes32)";

    let callFunctionId = await web3.eth.abi.encodeFunctionSignature(
      functionName
    );

    const type = [
      "address",
      "bytes4",
      "address",
      "uint256[]",
      "uint256[]",
      "uint256[]",
      "uint256",
    ];

    const data = [
      DELIVERY_ADDRESS,
      callFunctionId,
      KAWAIICORE_ADDRESS,
      ["1"],
      [10],
      [1],
      dateNow,
    ];

    let encodehash = await web3.utils.soliditySha3(
      await web3.eth.abi.encodeParameters(type, data)
    );

    const sign = await web3.eth.accounts.sign(
      encodehash,
      "8438031b7f3abc7a38bb69a53a260d590bdfee87dc8aafcac9aae6a18f2e2d7e"
    );

    const res = await requestSign({
      data,
      type,
      v: sign.v,
      r: sign.r,
      s: sign.s,
    });

    const vrsAdminData = await web3.eth.abi.encodeParameters(
      ["uint8", "bytes32", "bytes32"],
      [res.v, res.r, res.s]
    );

    alert(`ký thành công: ${vrsAdminData}`);

    setAdminSignedDataDelivery(vrsAdminData);
  };

  const handleUserSignedDelivery = async () => {
    const nonce = await read("nonces", DELIVERY_ADDRESS, ABI_DELIVERY, [
      account,
    ]);
    const msgParams = JSON.stringify({
      domain: {
        chainId: CHAIN_ID,
        name: "KawaiiDelivery",
        verifyingContract: DELIVERY_ADDRESS,
        version: "1",
      },
      message: {
        adminSignedData: adminSignedDataDelivery,
        nonce,
      },
      primaryType: "Data",
      types: {
        EIP712Domain: [
          { name: "name", type: "string" },
          { name: "version", type: "string" },
          { name: "chainId", type: "uint256" },
          { name: "verifyingContract", type: "address" },
        ],
        Data: [
          { name: "adminSignedData", type: "bytes" },
          { name: "nonce", type: "uint256" },
        ],
      },
    });

    var params = [account, msgParams];
    var method = "eth_signTypedData_v4";

    const res = await library.provider.send(method, params);
    const sign = splitSignature(res.result);
    await write(
      "delivery",
      library.provider,
      PROXY_ADDRESS,
      ABI_REPLY,
      account,
      [
        DELIVERY_ADDRESS,
        KAWAIICORE_ADDRESS,
        ["1"],
        [10],
        [1],
        dateNow,
        account,
        adminSignedDataDelivery,
        sign.v,
        sign.r,
        sign.s,
      ],
      (hash) => console.log(hash)
    );
  };

  const handleAdminSignedMinting = async () => {
    const web3 = new Web3(RPC_URL_97);

    let functionName =
      "convertItem(address,uint256,uint256,uint256,address,bytes,uint8,bytes32,bytes32)";
    let callFunctionId = await web3.eth.abi.encodeFunctionSignature(
      functionName
    );

    const type = [
      "address",
      "bytes4",
      "address",
      "uint256",
      "uint256",
      "uint256",
    ];

    const data = [
      MINTING_ADDRESS,
      callFunctionId,
      KAWAIICORE_ADDRESS,
      1,
      1,
      dateNow,
    ];

    let encodehash = await web3.utils.soliditySha3(
      await web3.eth.abi.encodeParameters(type, data)
    );

    const sign = await web3.eth.accounts.sign(encodehash, privateKey);

    const res = await requestSign({
      data,
      type,
      v: sign.v,
      r: sign.r,
      s: sign.s,
    });

    const vrsAdminData = await web3.eth.abi.encodeParameters(
      ["uint8", "bytes32", "bytes32"],
      [res.v, res.r, res.s]
    );
    setAdminSignedDataMinting(vrsAdminData);
    alert(`ký thành công: ${vrsAdminData}`);
  };

  const handleUserSignedMinting = async () => {
    const nonce = await read("nonces", MINTING_ADDRESS, ABI_MINTING, [account]);
    const msgParams = JSON.stringify({
      domain: {
        chainId: CHAIN_ID,
        name: "KawaiiMinting",
        verifyingContract: MINTING_ADDRESS,
        version: "1",
      },
      message: {
        adminSignedData: adminSignedDataMinting,
        nonce,
      },
      primaryType: "Data",
      types: {
        EIP712Domain: [
          { name: "name", type: "string" },
          { name: "version", type: "string" },
          { name: "chainId", type: "uint256" },
          { name: "verifyingContract", type: "address" },
        ],
        Data: [
          { name: "adminSignedData", type: "bytes" },
          { name: "nonce", type: "uint256" },
        ],
      },
    });

    var params = [account, msgParams];
    var method = "eth_signTypedData_v4";

    const res = await library.provider.send(method, params);
    const sign = splitSignature(res.result);
    await write(
      "convertItem",
      library.provider,
      PROXY_ADDRESS,
      ABI_REPLY,
      account,
      [
        MINTING_ADDRESS,
        KAWAIICORE_ADDRESS,
        1,
        1,
        dateNow,
        account,
        adminSignedDataMinting,
        sign.v,
        sign.r,
        sign.s,
      ],
      (hash) => console.log(hash)
    );
  };

  return (
    <div>
      <div>
        <div style={{ marginBottom: 50 }}>Crafting</div>
        <Button
          variant="contained"
          color="primary"
          onClick={handleAdminSignedCrafting}
        >
          Admin signed
        </Button>
        <Button
          variant="contained"
          color="primary"
          style={{ marginLeft: 50 }}
          onClick={() => handleApprove(CRAFTING_ADDRESS)}
        >
          Approve
        </Button>
        <Button
          variant="contained"
          color="primary"
          style={{ marginLeft: 50 }}
          onClick={() => handleApproveAll(CRAFTING_ADDRESS)}
        >
          Approve All
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleUserSignedCrafting}
          style={{ marginLeft: 50 }}
        >
          Signed and Crafting Item
        </Button>
      </div>
      <div style={{ marginTop: 50 }}>
        <div style={{ marginBottom: 50 }}>Delivery</div>
        <Button
          variant="contained"
          color="primary"
          onClick={handleAdminSignedDelivery}
        >
          Admin signed
        </Button>
        <Button
          variant="contained"
          color="primary"
          style={{ marginLeft: 50 }}
          onClick={() => handleApproveAll(DELIVERY_ADDRESS)}
        >
          Approve All
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleUserSignedDelivery}
          style={{ marginLeft: 50 }}
        >
          Signed and Delivery
        </Button>
      </div>

      <div style={{ marginTop: 50 }}>
        <div style={{ marginBottom: 50 }}>Minting</div>
        <Button
          variant="contained"
          color="primary"
          onClick={handleAdminSignedMinting}
        >
          Admin signed
        </Button>
        <Button
          variant="contained"
          color="primary"
          style={{ marginLeft: 50 }}
          onClick={() => handleApprove(MINTING_ADDRESS)}
        >
          Approve
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleUserSignedMinting}
          style={{ marginLeft: 50 }}
        >
          Signed and Minting
        </Button>
      </div>
    </div>
  );
};

export default SignedData;
