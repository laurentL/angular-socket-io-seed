/**
 pour savoir si la grille est gagnante pour un joueur, seul les jeton de ce joueur sont interessant.
 pour caque case il n'y a que deux possibilitées, ou elle est occupé par un point du dit joueur noté bool 1
 ou pas ( vide ou adversaire ne change rien) que l'on notera bool 0

 la grille de puissance 4 est de ce fait un champ de 48 bits.
 le & des deux grilles donne la liste des cases occupées

 */
function isWinner(grid) {
  /*
   Pour resoudre le probleme des 4 jetons, il suffit de verifier 2 fois que deux jetons sont alignés et que ces 2 alignement le soit entre eux
   Verifier que 2 bool 1 se suivent dans un champ lineaire se fait ainsi: twice = int & ( int >> 1)
   ainsi verifier que 2 fois 2 jetons se suivent donne ceci : ( twice && ( twice >> 2) > 0 )

   Explication du test horizontal:
   On decalle de un colone et on compare, ce qui met a 1 les alignements de 2 jetons
   donc
   1000 & 0100 => 0000
   1100 & 0110 => 0100 on a une fois 2 jetons alignés
   0111 & 0011 => 0011 on a 2 fois 2 jetons alignés
   1111 & 0111 => 0111 on a 3 fois 2 jetons alignés

   deuxieme passe:
   on decale de 14 => 2 colonnes et on compare avec un et logique
   0000 & 0000 =>  0000 => You loose
   0100 & 0001 =>  0000 => You loose
   0011 & 0000 =>  0000 => You loose
   0111 & 0010 =>  0010 => Fatality.....
   */

  // UP
  /*var twiceTokens = grid & (grid >> 1);             // up
  //noinspection JSBitwiseOperatorUsage
  if (twiceTokens & (twiceTokens >> 2)) {         // up + up

    return true;
  }*/
  var twiceTokens = BitwiseAndLarge(grid , (grid * Math.pow(2,1)));
  if (BitwiseAndLarge(twiceTokens, twiceTokens * Math.pow(2,2)) >0) {
    return true;
  }


  // left
  /*
  twiceTokens = grid & (grid >> 7);             // left
  //noinspection JSBitwiseOperatorUsage
  if (twiceTokens & (twiceTokens >> 2 * 7)) {     // left + left

    return true;
  }*/
  var twiceTokens = BitwiseAndLarge(grid , (grid * Math.pow(2,7)));
  if (BitwiseAndLarge(twiceTokens, twiceTokens * Math.pow(2,7 *2) ) >0) {
    return true;
  }

  // diagonal down right
  /*
  twiceTokens = grid & (grid >> 8);
  //noinspection JSBitwiseOperatorUsage
  if (twiceTokens & (twiceTokens >> 2 * 8)) {

    return true;
  }*/
  var twiceTokens = BitwiseAndLarge(grid , (grid * Math.pow(2,8)));
  if (BitwiseAndLarge(twiceTokens, twiceTokens * Math.pow(2,8*2)) >0) {
    return true;
  }

  // diagonal upper right
  /*
  twiceTokens = grid & (grid >> 6);
  //noinspection JSBitwiseOperatorUsage
  if (twiceTokens & (twiceTokens >> 2 * 6)) { // return the last result in bool type

    return true;
  }*/
  var twiceTokens = BitwiseAndLarge(grid , (grid * Math.pow(2,6)));
  if (BitwiseAndLarge(twiceTokens, twiceTokens * Math.pow(2,6 * 2)) >0) {
    return true;
  }
  return false;

}


var p4 = {
  isWinner: isWinner
};

module.exports = p4;

function BitwiseAndLarge(val1, val2) {
  var shift = 0, result = 0;
  var mask = ~((~0) << 30); // Gives us a bit mask like 01111..1 (30 ones)
  var divisor = 1 << 30; // To work with the bit mask, we need to clear bits at a time
  while( (val1 != 0) && (val2 != 0) ) {
    var rs = (mask & val1) & (mask & val2);
    val1 = Math.floor(val1 / divisor); // val1 >>> 30
    val2 = Math.floor(val2 / divisor); // val2 >>> 30
    for(var i = shift++; i--;) {
      rs *= divisor; // rs << 30
    }
    result += rs;
  }
  return result;
}