var EventEmitter = require('events').EventEmitter;
var diskspace = require('diskspace');

var ERR_NO_PATH = "no path provided";
var DEF_UNIT = "MB";

var attributes = {
  queryTimeout: setQueryTimeout,
  lowSpaceThres: setLowSpaceThres,
  highSpaceThres: setHighSpaceThres
};

var spaceFactor = {
  GB: 1024 * 1024 * 1024,
  MB: 1024 * 1024,
  KB: 1024,
  B: 1
}

function DiskSpaceMonitor(_path)
{
  if(!_path)
    throw new Error(ERR_NO_PATH);
  this.path = _path;
}

function setQueryTimeout(_timeout)
{
  this.queryTimeout = _timeout;
  return true;
}

function setLowSpaceThres(_threshold, _unit)
{
  if(_unit && !spaceFactor[_unit])
    return false;
  if(!this.lowSpaceUnit)
    this.lowSpaceUnit = _unit ? _unit : DEF_UNIT;
  this.lowSpaceThres = _threshold * spaceFactor[this.lowSpaceUnit];
  return true;
}

function setHighSpaceThres(_threshold, _unit)
{
  if(_unit && !spaceFactor[_unit])
    return false;
  if(!this.highSpaceUnit)
    this.highSpaceUnit = _unit ? _unit : DEF_UNIT;
  this.highSpaceThres = _threshold * spaceFactor[this.highSpaceUnit];
  return true;
}

function activate(_args)
{
  for(_arg in _args)
  {
    if(!attributes[_arg])
      continue;
    if(!attributes[_arg].apply(this, _args[_arg]))
    {
      return false;
    }
  }
  if(!this.queryTimeout)
    return false;
  this.diskSpaceQuery =
    setInterval(makeDiskSpaceQuery.bind(this), this.queryTimeout);
  return true;
}

function deactivate()
{
  clearInterval(this.diskSpaceQuery);
  return true;
}

function makeDiskSpaceQuery()
{
  diskspace.check(this.path, function(total, free, status){
    if(status !== 'READY')
      this.emit('error', status);
    else
    {
      if(this.lowSpaceThres && free < this.lowSpaceThres)
        this.emit('lowDiskSpace', free / spaceFactor[this.lowSpaceUnit]);
      else if(this.highSpaceThres && free > this.highSpaceThres)
        this.emit('highDiskSpace', free / spaceFactor[this.highSpaceUnit]);
    }
  }.bind(this));
  return true;
}

DiskSpaceMonitor.prototype = new EventEmitter();
DiskSpaceMonitor.prototype.DiskSpaceMonitor = DiskSpaceMonitor;
DiskSpaceMonitor.prototype.setQueryTimeout = setQueryTimeout;
DiskSpaceMonitor.prototype.setLowSpaceThres = setLowSpaceThres;
DiskSpaceMonitor.prototype.setHighSpaceThres = setHighSpaceThres;
DiskSpaceMonitor.prototype.activate = activate;
DiskSpaceMonitor.prototype.deactivate = deactivate;
DiskSpaceMonitor.prototype.makeDiskSpaceQuery = makeDiskSpaceQuery;

exports.DiskSpaceMonitor = DiskSpaceMonitor;
