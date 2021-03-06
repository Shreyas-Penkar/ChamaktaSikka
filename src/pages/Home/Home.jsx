import React, {useState, useEffect} from 'react';
import styles from './Home.module.css';
import axios from 'axios';
import io from 'socket.io-client';
import { FiCopy } from 'react-icons/fi'
import { AiFillCloseCircle } from 'react-icons/ai'
import Loader from '../../components/Loader/Loader';
import { format, parseISO } from "date-fns";
const port = parseInt((window.location.href).split(':')[2].substr(0,4))

let baseAddress = ''
if(process.env.REACT_APP_MODE === 'DEVELOPMENT'){
  baseAddress = `http://localhost:${port+2000}`
}
console.log(baseAddress)

const socket = io.connect(`${baseAddress}/`);

const Home = () => {
  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);

  const [payToId, setPayToId] = useState("");
  const [payAmount, setPayAmount] = useState(0);
  const [payIncentive, setPayIncentive] = useState(0);
  const [isInfoCardVisible, setIsInfoCardVisible] = useState(false);
  const [userToDisplayInfoCard, setUserToDisplayInfoCard] = useState(null);

  const [memPool, setMemPool] = useState([]);
  const [blockchain, setBlockchain] = useState([]);
  const [isPayingLoading, setIsPayingLoading] = useState(false);
  const [isMiningLoading, setIsMiningLoading] = useState(false);

  const toggleInfoCardVisibility = () => {
    setIsInfoCardVisible(!isInfoCardVisible);
  }

  const copyMyPublicKey = () => {
    navigator.clipboard.writeText(user.hash_public_key);
  }

  useEffect(() => {
      socket.emit("refresh_connected_users");
      socket.emit("refresh_keys");
      socket.emit("refresh_transactions");
      socket.emit("refresh_blockchain");

      socket.on("connected_users", data => {
        setAllUsers(data);
      });

      socket.on("provide_keys", data => {
        setUser(data);
      })

      socket.on("transactions", data => {
        setMemPool(data);
      });

      socket.on("blockchain", chaindata => {
        setBlockchain(chaindata);
      })

      return () => {
        socket.close()
      }
  }, []);

  const validateFields = () => {
    if(payToId.trim() == ""){
      alert("Enter a valid address for the receiver."); 
      return false;
    }
    if(parseFloat(payAmount) < 0 || parseFloat(payIncentive) < 0){
      alert("Amounts should be positive");
      return false;
    }
    return true;
  }

  const payToSomeone = () => {
    if(!validateFields()){return;}
    setIsPayingLoading(true);
    axios.post(`${baseAddress}/api/perform_transaction`, {
      "receiver_public_key": payToId,
      "amount": parseFloat(payAmount),
      "incentive": parseFloat(payIncentive)
    }).then((res) => {
      setIsPayingLoading(false);
      setPayAmount(0);
      setPayToId("");
      setPayIncentive(0);
    })
    .catch((e) => {
      setIsPayingLoading(false);
      alert(e.response.data.message);
    })
  }

  const mineBlock = () => {
    setIsMiningLoading(true);
    axios.post(`${baseAddress}/api/mine_block`)
    .then((res) => {
      setIsMiningLoading(false);
    })
    .catch((e) => {
      setIsMiningLoading(false);
      alert("Block not mined");
    })
  }

  return (
    <div className={styles.homePage}>
      <UserInfoCard userToDisplayInfoCard={userToDisplayInfoCard} isInfoCardVisible={isInfoCardVisible} setIsInfoCardVisible={setIsInfoCardVisible} />
      <div className={styles.homeNavContainer}>
        <span className={styles.header}>Chamakta Sikka</span>
        <span className={styles.subHeader}>Our Own Cryptocurrency</span>
      </div>
      <div className={styles.homePagePortalContainer}>
        <div className={styles.usersOnlineContainer}>
          <span className={styles.usersOnlineHeader}>Users Online</span>
          <div className={styles.usersOnlineListContainer}>
            {
              allUsers.map((thisUser, index) => {
                return <UserAvatar user={thisUser} index={index} setUserToDisplayInfoCard={setUserToDisplayInfoCard} toggleInfoCardVisibility={toggleInfoCardVisibility} />
              })
            }
          </div>
        </div>

        <div className={styles.payAndAccountContainer}>
          <div className={styles.payOuterContainer}>
            <span className={styles.payHeader}>Pay Someone</span>
            <div className={styles.payInnerContainer}>
              <div className={styles.payForm}>
                <span className={styles.inputLabel}>To</span>
                <input className={styles.payToInput} value={payToId} onChange={(e) => {setPayToId(e.target.value)}} type="text"/>
                <span className={styles.inputLabel}>Amount</span>
                <input className={styles.payAmountInput} value={payAmount} onChange={(e) => {setPayAmount(e.target.value)}} type="number"/>
                <span className={styles.inputLabel}>Incentive</span>
                <input className={styles.payAmountInput} value={payIncentive} onChange={(e) => {setPayIncentive(e.target.value)}} type="number"/>
                <button className={styles.payBtn} onClick={payToSomeone}>
                  {(isPayingLoading) ? <Loader size={20} border={3} color={"#ffffff"}/> : "PAY"}
                </button>
              </div>
            </div>
          </div>

          <div className={styles.accountOuterContainer}>
            <span className={styles.accountHeader}>Your Account</span>
            <div className={styles.accountCardContainer}>
              <div className={styles.walletContainer}>
                <span className={styles.walletHeader}>PORT {(user != null) ? user.PORT : ""}'s Wallet</span>
                <div className={styles.walletValueContainer}>
                  <span className={styles.walletValue}>{(user != null) ? user.wallet : "0"}</span>
                  <span className={styles.walletValueUnit}>csk</span>
                </div>
              </div>
              <div className={styles.accountNumberContainer}>
                <span className={styles.accountNumberHeader}>Public Key</span>
                <div className={styles.accountPublicKeyWithCopy}>
                  <span className={styles.accountNumberValue}>{ ( user != null) ? user.hash_public_key : 0}</span>
                  <FiCopy onClick={copyMyPublicKey} className={styles.myKeyCopyBtn} size={25} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.mempoolBoxContainer}>
          <div className={styles.mempoolOuterContainer}>
            <div className={styles.mempoolHeaderContainer}>
              <span className={styles.mempoolHeader}>Mempool</span>
              <button className={styles.mineBtn} onClick={mineBlock}>
                {(isMiningLoading) ? <Loader size={20} border={3} color={"#ffffff"}/> : "MINE"}
              </button>
            </div>
            
            <div className={styles.mempoolInnerContainer}>
              {
                memPool.map((transaction) => {
                  return <MempoolTransactionCard transaction={transaction} />
                })
              }
            </div>
          </div>
          
        </div>

        <div className={styles.blockchainBoxContainer}>
          <div className={styles.blockchainOuterContainer}>
            <div className={styles.blockchainHeaderContainer}>
              <span className={styles.blockchainHeader}>Blockchain</span>
            </div>
            <div className={styles.blockchainInnerContainer}>
              {
                blockchain.map((block) => {
                  return <BlockChainCard block={block} />
                })
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const UserAvatar = ({user, index, toggleInfoCardVisibility, setUserToDisplayInfoCard}) => {
  
  const userColorArray = [
    {start: '#F33030', end: '#F47272'},
    {start: '#30F27E', end: '#70F37D'},
    {start: '#3097F6', end: '#69ACEA'},
    {start: '#BB29FF', end: '#D67EF4'},
    {start: '#FFB629', end: '#FFB629'}
  ]

  const onUserAvatarClick = () => {
    setUserToDisplayInfoCard(user);
    toggleInfoCardVisibility();
  }


  return (
    <div onClick={onUserAvatarClick} className={styles.userAvatar} style={{backgroundImage : `linear-gradient(145deg, ${userColorArray[index % userColorArray.length].start}, ${userColorArray[index % userColorArray.length].end})`}}>
      
    </div>
  );
}

const UserInfoCard = ({userToDisplayInfoCard, isInfoCardVisible, setIsInfoCardVisible}) => {

  const copyPublicKey = () => {
    navigator.clipboard.writeText(userToDisplayInfoCard.hash_public_key);
  }

  return (
    <>{(isInfoCardVisible) && 
      <div className={styles.userInfoCardBackground}>
        <div className={styles.userInfoContainer}>
          <AiFillCloseCircle className={styles.userInfoContainerCloseBtn} onClick={() => {setIsInfoCardVisible(false)}} size={22} />
          
          <div className={styles.userInfoContainerGrid}>
            <span className={styles.infoTitle}>PORT: </span>
            <span className={styles.infoValue}>{userToDisplayInfoCard.PORT}</span>
            <span></span>
            <div className={styles.infoTitle}>Public Key: </div>
            <span className={styles.infoValue}>{userToDisplayInfoCard.hash_public_key} </span>
            <FiCopy onClick={copyPublicKey} className={styles.infoKeyCopyBtn} size={22} />
          </div>
        </div>
      </div>
    }</>
  );
}

const MempoolTransactionCard = ({transaction}) => {

  return (
    <div className={styles.mempoolTransactionCardContainer}>
      <div className={styles.transactionCard}>
        <span className={styles.transactionCardHeader}>Transaction Hash</span>
        <span className={styles.transactionCardValue}>{transaction.transaction_hash}</span>
        <span className={styles.transactionCardHeader}>Sender</span>
        <span className={styles.transactionCardValue}>{transaction.sender_hash_public_key}</span>
        <span className={styles.transactionCardHeader}>Reciever</span>
        <span className={styles.transactionCardValue}>{transaction.receiver_public_key}</span>
        <span className={styles.transactionCardHeader}>Amount</span>
        <span className={styles.transactionCardValue}>{transaction.amount} csk</span>
        <span className={styles.transactionCardHeader}>Incentive</span>
        <span className={styles.transactionCardValue}>{transaction.incentive} csk</span>
        <span className={styles.transactionCardHeader}>Timestamp</span>
        <span className={styles.transactionCardValue}>{format(parseISO(transaction.timestamp), "KK:mm:ss b dd/MM/yyyy")}</span>
      </div>
    </div>
  );
}

const BlockChainCard = ({block}) => {

  const calTotalAmount = (transactions_list) => {
    let total = 0;
    transactions_list.forEach(transact => {
      total += transact.amount + transact.incentive;
    });
    return total;
  }

  return (
    <div className={styles.mempoolTransactionCardContainer}>
      <div className={styles.transactionCard}>
        <span className={styles.transactionCardHeader}>Block Number</span>
        <span className={styles.transactionCardValue}>{block.block_number}</span>
        <span className={styles.transactionCardHeader}>Nonce</span>
        <span className={styles.transactionCardValue}>{block.nonce}</span>
        <span className={styles.transactionCardHeader}>No. of Transactions</span>
        <span className={styles.transactionCardValue}>{block.transactions_list.length}</span>
        <span className={styles.transactionCardHeader}>Total Amount</span>
        <span className={styles.transactionCardValue}>{calTotalAmount(block.transactions_list)}</span>
        <span className={styles.transactionCardHeader}>Miner</span>
        <span className={styles.transactionCardValue}>{block.miner_hash_public_key}</span>
        <span className={styles.transactionCardHeader}>Previous Block Hash</span>
        <span className={styles.transactionCardValue}>{block.previous_block_hash}</span>
        <span className={styles.transactionCardHeader}>Block Hash</span>
        <span className={styles.transactionCardValue}>{block.block_hash}</span>
        <span className={styles.transactionCardHeader}>Timestamp</span>
        <span className={styles.transactionCardValue}>{format(parseISO(block.timestamp), "KK:mm:ss b dd/MM/yyyy")}</span>
      </div>
    </div>
  );
}

export default Home;