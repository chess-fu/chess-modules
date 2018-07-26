import 'mocha';
import { assert } from 'chai';
import { PgnParser } from './pgnParser';

describe('PgnDataCursor', function () {

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

  it.only('parses full game', function () {
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
    console.log(JSON.stringify(games, null, 2));
  });

  it('parses game with annotations', function () {
    const parser = new PgnParser();
    const games = parser.parse(`
    1.e4 c7-c6 2.Nf3 d5$01 3...Nc3?? Bg4+! 4.h3 Bxf3 *
    `);
    console.log(JSON.stringify(games, null, 2));
  });
});