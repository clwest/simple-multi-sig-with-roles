import React from "react";
import { useHistory } from "react-router-dom";
import { Select, Button, List, Input, Spin } from "antd";
import { Address, AddressInput } from "../components";
import { useLocalStorage } from "../hooks";
const axios = require('axios');
const { Option } = Select;

export default function Owners({ contractName, ownerEvents, signaturesRequired, address, nonce, userProvider, mainnetProvider, localProvider, yourLocalBalance, price, tx, readContracts, writeContracts, blockExplorer }) {

  const history = useHistory();

  const [to, setTo] = useLocalStorage("to");
  const [amount, setAmount] = useLocalStorage("amount", "0");
  const [methodName, setMethodName] = useLocalStorage("addSigner");
  const [owner, setOwner] = useLocalStorage("owner");
  const [newRole, setNewRole] = useLocalStorage("DEFAULT_ROLE");
  const [newSignaturesRequired, setNewSignaturesRequired] = useLocalStorage("newSignaturesRequired");
  const [data, setData] = useLocalStorage("data", "0x");

  return (
    <div>
      <h2 style={{ marginTop: 32 }}>Signatures Required: {signaturesRequired ? signaturesRequired.toNumber() : <Spin></Spin>}</h2>
      <List
        style={{ maxWidth: 400, margin: "auto", marginTop: 32 }}
        bordered
        dataSource={ownerEvents}
        renderItem={(item) => {
          return (
            <List.Item key={"owner_" + item[0]}>
              <Address
                address={item[0]}
                ensProvider={mainnetProvider}
                blockExplorer={blockExplorer}
                fontSize={32}
              />
              <div style={{ padding: 16 }}>
                {item[1] ? "👍" : "👎"}
              </div>
            </List.Item>
          )
        }}
      />

      <div style={{ border: "1px solid #cccccc", padding: 16, width: 400, margin: "auto", marginTop: 64 }}>
        <div style={{ margin: 8, padding: 8 }}>
          <Select value={methodName} style={{ width: "100%" }} onChange={setMethodName}>
            <Option key="addSigner">addSigner()</Option>
            <Option key="removeSigner">removeSigner()</Option>
          </Select>
        </div>
        <div style={{ margin: 8, padding: 8 }}>
          <AddressInput
            autoFocus
            ensProvider={mainnetProvider}
            placeholder="owner address"
            value={owner}
            onChange={setOwner}
          />
        </div>
        {methodName == "addSigner" ?
          <div style={{ margin: 8, padding: 8 }}>
            <Select value={newRole} style={{ width: "100%" }} onChange={setNewRole}>
              <Option key="OG_ROLE">OG</Option>
              <Option key="DEFAULT_ROLE">DEFAULT</Option>
            </Select>
          </div>
          :
          null
        }
        <div style={{ margin: 8, padding: 8 }}>
          <Input
            ensProvider={mainnetProvider}
            placeholder="new # of signatures required"
            value={newSignaturesRequired}
            onChange={(e) => { setNewSignaturesRequired(e.target.value) }}
          />
        </div>
        <div style={{ margin: 8, padding: 8 }}>
          <Button onClick={() => {
            let calldata = "";
            if (methodName == "addSigner") {
              calldata = readContracts[contractName].interface.encodeFunctionData(methodName, [owner, newRole, newSignaturesRequired]);
            } else {
              calldata = readContracts[contractName].interface.encodeFunctionData(methodName, [owner, newSignaturesRequired]);
            }
            setData(calldata)
            setAmount("0")
            setTo(readContracts[contractName].address)
            setTimeout(() => {
              history.push('/create')
            }, 777)
          }}>
            Create Tx
          </Button>
        </div>
      </div>
    </div>
  );
}
