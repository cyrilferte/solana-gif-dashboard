import {AfterViewChecked, AfterViewInit, Component, HostListener, OnInit} from '@angular/core';
import * as idl from './idl.json';
import {Connection, PublicKey, clusterApiUrl, SystemProgram} from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';
import { Buffer } from 'buffer';
window.Buffer = Buffer;

declare let window: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit, AfterViewChecked {
  title = 'solana-gif-tbbt';
  TEST_GIFS = [
    'https://i.giphy.com/media/eIG0HfouRQJQr1wBzz/giphy.webp',
    'https://media3.giphy.com/media/L71a8LW2UrKwPaWNYM/giphy.gif?cid=ecf05e47rr9qizx2msjucl1xyvuu47d7kf25tqt2lvo024uo&rid=giphy.gif&ct=g',
    'https://media4.giphy.com/media/AeFmQjHMtEySooOc8K/giphy.gif?cid=ecf05e47qdzhdma2y3ugn32lkgi972z9mpfzocjj6z1ro4ec&rid=giphy.gif&ct=g',
    'https://i.giphy.com/media/PAqjdPkJLDsmBRSYUp/giphy.webp'
  ]
  PROD_GIFS = [];
  publicId: string | undefined;
  urlForm: any;
  idlObj = (idl as any)
  baseAccount:any = "DnizRJ7Nu92bfZ5CTmkPv4LQBsau9K12w8uQBEYVa9qm";


  @HostListener('window:load')
  onLoad() {
    this.checkIfWalletIsConnected()
  }

  constructor() {
    window.solana.on("accountChanged", (accounts:any) => {
      this.publicId = undefined
      this.checkIfWalletIsConnected()
    })
    window.solana.on('chainChanged', (id:any) => {
      console.log(id);
      this.publicId = undefined
      this.checkIfWalletIsConnected()
    })
  }

  async checkIfWalletIsConnected() {
    try {
      const {solana} = window;

      if (solana) {
        if (solana.isPhantom) {
          console.log('Phantom wallet found!', solana);
          const response = await solana.connect({onlyIfTrusted: true}).then(async (res:any)=>{
            this.publicId=  res.publicKey.toString()
            await this.getGifList()
          });


        }
      } else {
        alert('Solana object not found! Get a Phantom Wallet 👻');
      }
    } catch (error) {
      console.error(error);
    }
  };

  async connectWallet() {
    try {
      const {solana} = window;

      if (solana) {
        if (solana.isPhantom) {
          console.log('Phantom wallet found!', solana);
          const response = await solana.connect();
          console.log(
            'Connected with Public Key:',
            response.publicKey.toString()
          );
          this.publicId=  response.publicKey.toString()
          this.getGifList()
        }
      } else {
        alert('Solana object not found! Get a Phantom Wallet 👻');
      }
    } catch (error) {
      console.error(error);
    }
  }

  ngOnInit(): void {

  }

  ngAfterViewChecked(): void {
  }

  ngAfterViewInit(): void {

  }

  getProvider(){

// SystemProgram is a reference to the Solana runtime!
    const { SystemProgram, Keypair } = web3;

// Create a keypair for the account that will hold the GIF data.
    let baseAccount = Keypair.generate();

// Get our program's id from the IDL file.
    const programID = new PublicKey(this.idlObj.metadata.address);

// Set our network to devnet.
    const network = clusterApiUrl('devnet');

// Controls how we want to acknowledge when a transaction is "done".
    const opts:any = {
      preflightCommitment: "processed"
    }

    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection, window.solana, opts.preflightCommitment,
    );
    return provider;
  }

  async getGifList(){
    if(!this.publicId){
      return
    }
    const programID = new PublicKey(this.idlObj.metadata.address);
    const { SystemProgram, Keypair } = web3;
    let baseAccount = Keypair.generate();

    try {
      const provider = this.getProvider();
      const program = new Program((this.idlObj as any), programID, provider);
      const account = await program.account['baseAccount'].fetch(this.baseAccount);
      this.PROD_GIFS = account['gifList']
      console.log("Got the account", account)

    } catch (error) {
      console.log("Error in getGifList: ", error)
    }
  }


  addGif() {
    this.TEST_GIFS.push(this.urlForm)
    this.urlForm = ''
  }

  async createGifAccount(){
    try {
      const programID = new PublicKey(this.idlObj.metadata.address);
      const { SystemProgram, Keypair } = web3;
      let baseAccount = Keypair.generate();
      const provider = this.getProvider();
      const program = new Program(this.idlObj, programID, provider);
      console.log("ping", baseAccount, provider.wallet.publicKey)
      await program.rpc['startStuffOff']({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });
      this.baseAccount = baseAccount
      console.log("Created a new BaseAccount w/ address:", baseAccount.publicKey.toString())
      await this.getGifList();

    } catch(error) {
      console.log("Error creating BaseAccount account:", error)
    }
  }

  async sendGif(){
    if (this.urlForm.length === 0) {
      console.log("No gif link given!")
      return
    }

    console.log('Gif link:', this.urlForm);
    try {
      const provider = this.getProvider();
      const programID = new PublicKey(this.idlObj.metadata.address);
      const program = new Program(this.idlObj, programID, provider);

      await program.rpc['addGif'](this.urlForm, {
        accounts: {
          baseAccount: this.baseAccount,
          user: provider.wallet.publicKey,
        },
      });
      console.log("GIF successfully sent to program", this.urlForm)

      await this.getGifList();
    } catch (error) {
      console.log("Error sending GIF:", error)
    }
  };

  async upVote(id: number) {

    try {
      const provider = this.getProvider();
      const programID = new PublicKey(this.idlObj.metadata.address);
      const program = new Program(this.idlObj, programID, provider);

      await program.rpc['upvoteGif'](id, {
        accounts: {
          baseAccount: this.baseAccount,
          user: provider.wallet.publicKey,
        },
      });
      console.log("GIF successfully upvote to program", id)

      await this.getGifList();
    } catch (error) {
      console.log("Error upvote GIF:", error)
    }
  }

  async tipUser(srcImg: any) {
    try {
      const provider = this.getProvider();
      const programID = new PublicKey(this.idlObj.metadata.address);
      const program = new Program(this.idlObj, programID, provider);

      await program.rpc['sendSol']('6',  {
        accounts: {
          baseAccount: this.baseAccount,
          from: provider.wallet.publicKey,
          to: srcImg.userAddress,
          systemProgram: SystemProgram.programId
        },
      });
      console.log("GIF successfully tip to program", srcImg)

      await this.getGifList();
    } catch (error) {
      console.log("Error tip GIF:", error)
    }
  }

  copyUrl(srcImg: string) {
    navigator.clipboard.writeText(srcImg).then(r => {})
  }

  getUpvote(srcImg: any) {
    return srcImg.upvotes.words[0] ?? 0
  }
}
