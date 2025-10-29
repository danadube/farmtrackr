// Farm Google Sheets configuration
// Updated with correct spreadsheet IDs from user-provided links
export const FARM_SPREADSHEETS = {
  'Cielo': {
    name: 'Cielo',
    url: 'https://docs.google.com/spreadsheets/d/1tDS3ZuuzqQvV2HWEPhce3B1Pvd4hboAVu6QGR7KAPMQ/edit?usp=sharing',
    id: '1tDS3ZuuzqQvV2HWEPhce3B1Pvd4hboAVu6QGR7KAPMQ',
    sheetName: 'Sheet1'
  },
  'Escala': {
    name: 'Escala',
    url: 'https://docs.google.com/spreadsheets/d/10RtH6xqaJVSdEgP3vL1voea7orJNGgnjnl4kxjEcUR8/edit?usp=sharing',
    id: '10RtH6xqaJVSdEgP3vL1voea7orJNGgnjnl4kxjEcUR8',
    sheetName: 'Sheet1'
  },
  'Ivy': {
    name: 'Ivy',
    url: 'https://docs.google.com/spreadsheets/d/1LernlV9bfBYxpu0-4jbUq-qWZHiM68CstY36Iba6gDc/edit?usp=sharing',
    id: '1LernlV9bfBYxpu0-4jbUq-qWZHiM68CstY36Iba6gDc',
    sheetName: 'Sheet1'
  },
  'Presidential': {
    name: 'Presidential',
    url: 'https://docs.google.com/spreadsheets/d/1lQuifw4iBBKKPYY7eLBHeOkmq4iNVRkBZerp2Fu-hWA/edit?usp=sharing',
    id: '1lQuifw4iBBKKPYY7eLBHeOkmq4iNVRkBZerp2Fu-hWA',
    sheetName: 'Sheet1'
  },
  'San Marino': {
    name: 'San Marino',
    url: 'https://docs.google.com/spreadsheets/d/1trTaOkk7avsta0YDTzvfR1OUfxlpQSNrwhms-TNo_Q8/edit?usp=sharing',
    id: '1trTaOkk7avsta0YDTzvfR1OUfxlpQSNrwhms-TNo_Q8',
    sheetName: 'Sheet1'
  },
  'Santo Tomas': {
    name: 'Santo Tomas',
    url: 'https://docs.google.com/spreadsheets/d/1U5c93QFjthKRNexGV_WYgGsedC-JQwbo8w1yl5RLHmM/edit?usp=sharing',
    id: '1U5c93QFjthKRNexGV_WYgGsedC-JQwbo8w1yl5RLHmM',
    sheetName: 'Sheet1'
  },
  'Sterling Estates': {
    name: 'Sterling Estates',
    url: 'https://docs.google.com/spreadsheets/d/1wgwvJGLcV8JSeUU_aDIuQhpRSZSthFmvTXDk-VrxfMI/edit?usp=sharing',
    id: '1wgwvJGLcV8JSeUU_aDIuQhpRSZSthFmvTXDk-VrxfMI',
    sheetName: 'Sheet1'
  },
  'Sunterrace': {
    name: 'Sunterrace',
    url: 'https://docs.google.com/spreadsheets/d/1vLju9E0D1iG4a9W-1iIUvMkQlitV6qTWXE3YuT2NHbg/edit?usp=sharing',
    id: '1vLju9E0D1iG4a9W-1iIUvMkQlitV6qTWXE3YuT2NHbg',
    sheetName: 'Sheet1'
  },
  'Tamarisk CC Ranch': {
    name: 'Tamarisk CC Ranch',
    url: 'https://docs.google.com/spreadsheets/d/1vapoHX8IGwjf0TvnaAM-_MrifVxRcEw-rD5rDQmIMZM/edit?usp=sharing',
    id: '1vapoHX8IGwjf0TvnaAM-_MrifVxRcEw-rD5rDQmIMZM',
    sheetName: 'Sheet1'
  },
  'Versailles': {
    name: 'Versailles',
    url: 'https://docs.google.com/spreadsheets/d/1snrHogZ_BNt88zj-APT580KSGkdyHo15NZ8OkTtxTb4/edit?usp=sharing',
    id: '1snrHogZ_BNt88zj-APT580KSGkdyHo15NZ8OkTtxTb4',
    sheetName: 'Sheet1'
  },
  'Victoria Falls': {
    name: 'Victoria Falls',
    url: 'https://docs.google.com/spreadsheets/d/1JHweN43DjPtocHGfz5QYegEVBnXMhMywRB1a0raNslQ/edit?usp=sharing',
    id: '1JHweN43DjPtocHGfz5QYegEVBnXMhMywRB1a0raNslQ',
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
