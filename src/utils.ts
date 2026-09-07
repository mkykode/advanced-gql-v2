import dfnsFormat from 'date-fns/format/index.js'

export const formatDate = (stamp: Date | number, format: string): string =>
  dfnsFormat(stamp, format)
