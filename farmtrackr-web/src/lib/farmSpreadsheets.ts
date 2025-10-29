// Farm Google Sheets configuration
export const FARM_SPREADSHEETS = {
  'Alicante': {
    name: 'Alicante',
    url: 'https://docs.google.com/spreadsheets/d/1nQmKfv_nTiDcW8DJhexLJRbZvH-wY4YTlR74BR1SUTY/edit?usp=drive_link',
    id: '1nQmKfv_nTiDcW8DJhexLJRbZvH-wY4YTlR74BR1SUTY',
    sheetName: 'Sheet1' // Default sheet name, can be customized
  },
  'Cielo': {
    name: 'Cielo',
    url: 'https://docs.google.com/spreadsheets/d/1tDS3ZuuzqQvV2HWEPhce3B1Pvd4hboAVu6QGR7KAPMQ/edit?usp=drive_link',
    id: '1tDS3ZuuzqQvV2HWEPhce3B1Pvd4hboAVu6QGR7KAPMQ',
    sheetName: 'Sheet1'
  },
  'Escala': {
    name: 'Escala',
    url: 'https://docs.google.com/spreadsheets/d/10RtH6xqaJVSdEgP3vL1voea7orJNGgnjnl4kxjEcUR8/edit?usp=drive_link',
    id: '10RtH6xqaJVSdEgP3vL1voea7orJNGgnjnl4kxjEcUR8',
    sheetName: 'Sheet1'
  },
  'Ivy': {
    name: 'Ivy',
    url: 'https://docs.google.com/spreadsheets/d/1LernlV9bfBYxpu0-4jbUq-qWZHiM68CstY36Iba6gDc/edit?usp=drive_link',
    id: '1LernlV9bfBYxpu0-4jbUq-qWZHiM68CstY36Iba6gDc',
    sheetName: 'Sheet1'
  },
  'Presidential': {
    name: 'Presidential',
    url: 'https://docs.google.com/spreadsheets/d/1VtGOjuOw_11ehY5HXHkRWTHuml0FF2J4gPmCw6icvV4/edit?usp=drive_link',
    id: '1VtGOjuOw_11ehY5HXHkRWTHuml0FF2J4gPmCw6icvV4',
    sheetName: 'Sheet1'
  },
  'Santo Tomas': {
    name: 'Santo Tomas',
    url: 'https://docs.google.com/spreadsheets/d/1U5c93QFjthKRNexGV_WYgGsedC-JQwbo8w1yl5RLHmM/edit?usp=drive_link',
    id: '1U5c93QFjthKRNexGV_WYgGsedC-JQwbo8w1yl5RLHmM',
    sheetName: 'Sheet1'
  },
  'Sunterrace': {
    name: 'Sunterrace',
    url: 'https://docs.google.com/spreadsheets/d/1vLju9E0D1iG4a9W-1iIUvMkQlitV6qTWXE3YuT2NHbg/edit?usp=drive_link',
    id: '1vLju9E0D1iG4a9W-1iIUvMkQlitV6qTWXE3YuT2NHbg',
    sheetName: 'Sheet1'
  },
  'Versailles': {
    name: 'Versailles',
    url: 'https://docs.google.com/spreadsheets/d/1nKN_zNKnmuNQESHJrPy6-ZOhOVULSCX42F6fxJjLHjo/edit?usp=drive_link',
    id: '1nKN_zNKnmuNQESHJrPy6-ZOhOVULSCX42F6fxJjLHjo',
    sheetName: 'Sheet1'
  },
  'Victoria Falls': {
    name: 'Victoria Falls',
    url: 'https://docs.google.com/spreadsheets/d/19X1EREijaqEyfLSPMYy4c3WhpYBeEJWql_xZcrgzmNc/edit?usp=drive_link',
    id: '19X1EREijaqEyfLSPMYy4c3WhpYBeEJWql_xZcrgzmNc',
    sheetName: 'Sheet1'
  }
} as const

export type FarmName = keyof typeof FARM_SPREADSHEETS

export interface FarmSpreadsheet {
  name: string
  url: string
  id: string
  sheetName: string
}
