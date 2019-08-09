# react-native-log-panel

## Getting started

`$ npm install react-native-log-panel --save`


## Usage
###app启动页面卸载时释放
```javascript
import LogHolder from "react-native-log-panel";

componentWillUnmount() {
    ...
    LogHolder.releaseQuiet();
}
```
###使用页面初始化
```javascript
import LogHolder from "react-native-log-panel";

constructor(props) {
    super(props);
    ...
    this.logHolder = LogHolder.getInstance(50, false);//(limit,modal)
}

...
this.logHolder.switchLog(newState);
```
  