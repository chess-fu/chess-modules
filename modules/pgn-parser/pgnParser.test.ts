import 'mocha';
import { assert } from 'chai';
import { PgnParser } from './pgnParser';
import { PgnDataCursor } from './pgnDataCursor';
import { movesToString } from './pgnDataCursor-moves.test';
import { MoveHistory } from './pgnGame';
import { Hastings1999 } from './pgnDataset.test';

describe('PgnParser', function () {

  it('will construct', function () {
    assert.isNotNull(new PgnParser());
  });

  it('will parse game header', function () {
    const parser = new PgnParser();
    const games = parser.parse(`
      [a "b"][c "d"]{comment}[e"f"]
      [g"hi"]
    `);
    assert.isObject(games[0]);
    const headers = games[0].headersMap();
    assert.isObject(headers);
    assert.equal(headers.a, 'b');
    assert.equal(headers.c, 'd');
    assert.equal(headers.e, 'f');
    assert.equal(headers.g, 'hi');
  });

  it('parses game with annotations', function () {
    const parser = new PgnParser();
    const games = parser.parse(`
    1.e4 c7-c6 2.Nf3 d5$01 3...Nc3?? Bg4+! 4.h3 Bxf3 *
    `);
    assert.equal(games.length, 1);
    assert.equal(games[0].history.length, 9);
    const moves = games[0].history;
    // moves are numbered
    for (let i = 1; i <= 4; i++) assert(moves[(i - 1) * 2].number === i);
    assert.equal(moves[8].result, '*');
    assert.equal(moves[4].piece, 'N');
    assert.equal(moves[4].to, 'c3');
    assert.equal(moves[4].raw, 'Nc3??');
    assert.equal(moves[4].san, 'Nc3');
  });

  it('parses game with no stop', function () {
    const parser = new PgnParser();
    const games = parser.parse(`
    1.e4 c7 2.Nf3 d5 3.Nc3 Bg4 4.h3 Bxf3

[Next "Game"]`);
    assert.equal(games.length, 2);
    assert.equal(games[0].history.length, 8);
    assert.equal(games[0].history[7].raw, 'Bxf3');
  });

  it('parses game with comments', function () {
    const parser = new PgnParser();
    const games = parser.parse(`
    1.e4 {solid open} c7-c6 {really?} 2. {time for knights} Nf3 d5 {here we are}3.{
    this move!
    }Nc3 Bg4 4.h3 Bxf3 {one}{and two!}; and a three
    {game stops} *
    `);
    assert.equal(games.length, 1);
    assert.equal(games[0].history.length, 9);
    const moves = games[0].history;
    assert.equal(moves[8].result, '*');
    assert.deepEqual(moves[7], {
      piece: 'B',
      capture: true,
      to: 'f3',
      raw: 'Bxf3',
      san: 'Bxf3',
      comments: [
        'one',
        'and two!',
        ' and a three',
        'game stops'
      ]
    });
  });

  it('parses full game', function () {
    const parser = new PgnParser();
    const games = parser.parse(`
    [Event "21st European Teams"]
    [Site "Hersonissos GRE"]
    [Date "2017.10.29"]
    [Round "2.9"]
    [White "Adams,Mi"]
    [Black "Tari,A"]
    [Result "1/2-1/2"]
    [WhiteElo "2727"]
    [BlackElo "2578"]
    [ECO "B11"]
    
    1.e4 c6 2.Nf3 d5 3.Nc3 Bg4 4.h3 Bxf3 5.Qxf3 e6 6.g3 Nf6 7.Bg2 Bc5 8.O-O Nbd7
    9.d3 O-O 10.Qe2 Bd4 11.Nd1 dxe4 12.dxe4 Qc7 13.c3 Bc5 14.Ne3 a5 15.Kh2 Rfe8
    16.a4 Bf8 17.Nc4 Nc5 18.Bg5 h6 19.Bxf6 gxf6 20.Qg4+ Bg7 21.Qh5 Nxa4 22.Rxa4 b5
    23.Rxa5 Rxa5 24.Nxa5 Qxa5 25.Qc5 Qc7 26.Ra1 Bf8 27.Qd4 Qd8 28.Qe3 Qd6 29.Qf3 Qe5
    30.h4 Rd8 31.Ra6 Rc8 32.Ra7 Qb8 33.Ra6 Be7 34.Qe3 Kg7 35.Bf3 Qe5 36.Kg2 b4
    37.Be2 bxc3 38.bxc3 Bc5 39.Qd3 Qd6 40.Qxd6 Bxd6 41.f4 Bc5 42.Kf3 Kf8 43.Bc4 Bg1
    44.Ra2 Rb8 45.Ra6 Rc8 46.Ra1 1/2-1/2
    `);
    assert.equal(games.length, 1);
    assert.equal(games[0].headers.length, 10);
    assert.equal(games[0].history.length, 92);
    const moves = games[0].history;
    assert.equal(moves[moves.length - 1].result, '1/2-1/2');
  });

  it('parses game with rav and comments', function () {
    const parser = new PgnParser();
    const games = parser.parse(`
    [Event "2012 ROCHESTER GRAND WINTER OPEN"]
    [Site "Rochester"]
    [Date "2012.02.04"]
    [Round "1"]
    [White "Jensen, Matthew"]
    [Black "Gaustad, Kevin"]
    [Result "1-0"]
    [ECO "E01"]
    [WhiteElo "2131"]
    [BlackElo "1770"]
    [Annotator "Jensen, Matthew"]
    [PlyCount "61"]
    [EventDate "2012.02.02"]
    [Eventtype "swiss"]
    [Eventrounds "5"]
    [Eventcountry "USA"]
    [Sourcedate "2012.02.23"]
    [CurrentPosition "r1bqk2r/pp1nbppp/2p1pn2/3p4/2PP4/5NP1/PP2PPBP/RNBQ1RK1 w kq - 4 7"]
    
    { Kevin and I go way back.  I checked the USCF player stats and my previous record against Kevin was 4 losses and 1 draw out 
    of 5 games.  All of our previous games were between 1992-1998. } 1.d4 Nf6 2.c4 e6 3.g3 { Avrukh says to play 3.g3 instead of 
    3.Nf3 in case the Knight later comes to e2, as in the Bogo-Indian. } 3...d5 4.Bg2 c6 5.Nf3 Be7 6.O-O Nbd7 7.b3?! { My idea is to
    exchange dark-squared bishops and develop in the center. } ( 7.Qc2 O-O 8.Nbd2 b6 9.e4 { would have followed Avrukh's repertoire.  
    Play could continue } 9...Bb7 10.e5 Ne8 11.cxd5 cxd5 12.Re1 Rc8 13.Qa4 (
    13.Qd1 Qc7 14.Nf1 Qc2 15.Qxc2 Rxc2 16.Ne3 Rc8 17.Bd2 Nc7 18.Rac1 Ba6 19.h4 b5 20.Bf1 Nb6 21.b3 Ba3 22.Rc2 Nca8 23.Bd3 Rc7 24.Rxc7 
    Nxc7 25.Nc2 Be7 26.Nb4 Bb7 27.Rc1 Rc8 28.Nc6 Bxc6 29.Rxc6 b4 30.Ne1 Nca8 31.Rxc8+ Nxc8 32.Ba6 Ncb6 33.Nc2 Nc7 34.Bxb4 Bxh4 35.Bd3 
    Bd8 36.f4 f5 37.Bd6 Nd7 38.Kf2 Kf7 39.Ke3 h5 40.Be2 g6 41.Ne1 Ne8 42.Bb4 Nb8 43.Nf3 Nc6 44.Bc5 Be7 45.Bb5 Bxc5 46.Ng5+ { 1-0 (46) 
    Kasimdzhanov,R (2670)-Richter,M (2407)/Germany 2006/CBM 111/[Ribli] }    )
    13...Bc6 14.Qb3 b5 15.Bf1 Qb6 16.Bd3 ) 7...b6 { I was a little surprised that Black was waiting so long to castle.  I went ahead 
    with my plan of exchanging dark-squared bishops, and breaking in the center when  it is advantageous for me. } 8.Ba3 Bxa3 9.Nxa3 {
    In hindsight, the knight on a3 looks a bit out of play since it does not cover e4. } 9...Qe7 10.cxd5 { Since I'm ahead in development 
    I decided to exchange on d5.  If Black recaptures with the c-pawn I jump  to b5, and with the e-pawn it leaves a weakness on c6.  
    Bc8-a6 is a bit annoying
    after exd5, so I planned on relocating my a3-knight to e3. } 10...exd5 ( 10...Qxa3 { looked too dangerous for Black.  For example 
    } 11.dxc6 Nf8 12.Ne5 Nd5? ( { Houdini 1.5a x64: } 12...Ba6 13.Nc4 Bxc4 14.bxc4 Ng6 15.e4 { -0.11/19 } ) 13.e4 Nb4 14.d5 { with 
    a strong attack. } ) 11.Nc2 Ne4 ( 11...Ba6 12.Ne3 O-O { was  expected.  I think this position is about equal since Black can 
    put a rook on the c- and e-file with no problems. } ) 12.Ne3 Ndf6 { My plan now was to start  applying pressure as quickly as 
    possible, starting with the c6 pawn. } 13.Ne5 Bd7?! 14.Rc1 Rc8 15.b4! O-O ( 15...Qxb4? { is losing after } 16.Nxd7 Kxd7 ( 16...Nxd7
    17.Nxd5 ) 17.Bh3+ ) 16.Qa4 { I think at this point I have a clear advantage. } 16...Nd2 { I didn't consider this idea of playing 
    Ne4-d2-c4 followed by  b7-b5. } ( 16...b5 17.Qxa7 Ra8 18.Qb7 { threatening Nxc6. } ) 17.Rfd1 Nc4 18.N3xc4 b5 19.Qxa7 bxc4 20.Qc5 
    Qe6 21.Rc3 ( 21.a4 { looks stronger. } ) 21...Ra8 22.Re3 Qf5 23.Qd6 ( 23.Rf1 Rxa2 24.Nxc6 Bxc6 25.Qxc6 Rc8 26.Qb7 { is similar to 
    the 23...Rxa2 line except I didn't lose a tempi playing 23.Qd6 before capturing on c6. } 26...Raa8 27.Re5 { and d5 will fall. } ) 
    23...Qc2 ( 23...Rxa2 24.Nxc6 Bxc6 25.Qxc6 Rc8 26.Qb7 { looks close to equal. } 26...Raa8 27.Re5 Qc2 { slows White down. } ) 24.Rf1 {
    I stopped recording here due to time  pressure, but was able to reconstruct the game afterwards. } 24...Be8 25.Nxc6 Bxc6 26.Qxc6 
    Rxa2? 27.Bxd5 Nxd5 28.Qxd5 Rb2 29.Qc5 Rb8 30.Qc6? ( 30.d5 h6 31.d6 { is much more convincing } ) 30...R2xb4 ( 30...g6 31.d5 R2xb4 32.
    d6 { should still be winning } ) 31.Re8+ { Improvements:  - Exchanging dark-squared  bishops wasn't the best plan.  I should have 
    played the standard Qc2 and e2-e4. - 23.Qd6 was a mistake since Black had the chance to equalize after 23...Rxa2. I should have 
    played Rf1 preparing for 23...Rxa2. } 1-0
    `);
    assert.equal(games.length, 1);
    assert.equal(games[0].headers.length, 19); // 18 headers plus first comment... TODO fix this so that \n\n terminates headers
    assert.equal(games[0].history.length, 62);
    const moves = games[0].history;
    assert.equal(moves[moves.length - 1].result, '1-0');

    const ravs = moves.filter(m => m.rav);
    assert.equal(ravs.length, 10);

    const nested = (ravs[0].rav || []).filter(m => m.rav);
    assert.equal(nested.length, 1);
    assert.equal((nested[0].rav || []).length, 67);
  });

  it('parses a move with comments', function () {
    const cursor = new PgnDataCursor('Qd8 {My comment!}');
    const parser = new PgnParser();
    const move = parser.parseMove(cursor);
    assert.deepEqual(move, {
      piece: 'Q',
      to: 'd8',
      raw: 'Qd8',
      san: 'Qd8',
      comments: ['My comment!']
    });
  });

  it('parses a move of ...', function () {
    const cursor = new PgnDataCursor('...');
    const parser = new PgnParser();
    const move = parser.parseMove(cursor);
    assert.deepEqual(move, { raw: '...', to: '...' });
  });

  it('parses a move of ....', function () {
    const cursor = new PgnDataCursor('....');
    const parser = new PgnParser();
    const move = parser.parseMove(cursor);
    assert.deepEqual(move, { raw: '...', to: '...' });
  });

  it('parses numbered moves', function () {
    const parser = new PgnParser();
    const movePossibles = [
      ['', '5 ', '1.', '154.', '154.', '22...'], //move number
      ['', 'e', 'P4', 'e4', 'e4'], // source square
      ['d', 'd5'], // target square
    ];

    const all = movesToString(movePossibles);
    const results = all.map(test => {
      const cursor = new PgnDataCursor(test);
      try {
        const move = { test, ...parser.parseMove(cursor) as (MoveHistory & { test: string }) };
        return move;
      }
      catch (ex) {
        console.log(`${test}: ${ex.message}`);
        throw ex;
      }
    });

    // The move number is excluded, thus...
    const fail = results.filter(m => m.test.indexOf(m.raw || '~not~found~') < 0);
    if (fail.length) {
      console.log(fail.map(m => m.test));
      assert.fail('One or more tests failed.');
    }
  });

  it('Parses a full PGN game dataset', function () {
    const parser = new PgnParser();
    const games = parser.parse(Hastings1999);
    assert.equal(games.length, 44);
    const lastgame = games[games.length - 1];
    const lastmove = lastgame.moves()[lastgame.moves().length - 1];
    assert.deepEqual(lastmove, { number: 31, piece: 'Q', to: 'e8', san: 'Qe8', raw: 'Qe8' });
  });

  it('throws if not move text', function () {
    const parser = new PgnParser();
    assert.throws(() => parser.parse(`[A "B"]\n\n1.c4 / e7`), 'Expected move text');
  });
});