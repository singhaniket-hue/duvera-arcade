// Original four-in-a-row rules and tactical bot. GPL-3.0.
export const emptyBoard=()=>Array(42).fill(0);
export const legalMoves=board=>[3,2,4,1,5,0,6].filter(c=>!board[c]);
export function result(board){
 for(let r=0;r<6;r++)for(let c=0;c<7;c++)for(const [dx,dy]of [[1,0],[0,1],[1,1],[1,-1]]){
  const cells=Array.from({length:4},(_,i)=>[r+i*dy,c+i*dx]);
  if(cells.every(([y,x])=>y>=0&&y<6&&x>=0&&x<7)&&board[r*7+c]&&cells.every(([y,x])=>board[y*7+x]===board[r*7+c]))return {winner:board[r*7+c],cells:cells.map(([y,x])=>y*7+x)};
 }
 return board.every(Boolean)?{winner:0,draw:true,cells:[]}:null;
}
export function move(board,column,player){
 if(!Number.isInteger(column)||column<0||column>6||![1,2].includes(player)||board[column]||result(board))return null;
 const next=[...board];for(let r=5;r>=0;r--)if(!next[r*7+column]){next[r*7+column]=player;return next;}
 return null;
}
function heuristic(board,player){let value=0;for(let r=0;r<6;r++){if(board[r*7+3]===player)value+=7;if(board[r*7+3]===3-player)value-=7;}
 for(let r=0;r<6;r++)for(let c=0;c<7;c++)for(const [dx,dy]of [[1,0],[0,1],[1,1],[1,-1]]){
  const cells=Array.from({length:4},(_,i)=>[r+i*dy,c+i*dx]);if(!cells.every(([y,x])=>y>=0&&y<6&&x>=0&&x<7))continue;
  const a=cells.map(([y,x])=>board[y*7+x]);const own=a.filter(x=>x===player).length,other=a.filter(x=>x===3-player).length;
  if(!other)value+=[0,1,6,40,100000][own];if(!own)value-=[0,1,7,50,100000][other];
 }return value;
}
export function chooseMove(board,player,difficulty='normal',random=Math.random){
 const legal=legalMoves(board);if(!legal.length||result(board))return null;
 for(const c of legal)if(result(move(board,c,player))?.winner===player)return c;
 for(const c of legal)if(result(move(board,c,3-player))?.winner===3-player)return c;
 if(difficulty==='easy')return legal[Math.floor(random()*legal.length)];
 function search(b,turn,depth,alpha,beta){const end=result(b);if(end)return end.draw?0:end.winner===player?100000+depth:-100000-depth;if(!depth)return heuristic(b,player);
  let best=turn===player?-Infinity:Infinity;for(const c of legalMoves(b)){const v=search(move(b,c,turn),3-turn,depth-1,alpha,beta);if(turn===player){best=Math.max(best,v);alpha=Math.max(alpha,v);}else{best=Math.min(best,v);beta=Math.min(beta,v);}if(beta<=alpha)break;}return best;
 }
 let best=-Infinity,choice=legal[0];for(const c of legal){const v=search(move(board,c,player),3-player,4,-Infinity,Infinity);if(v>best){best=v;choice=c;}}return choice;
}
