/**打开本地的rap项目*/
import React, {PropTypes} from 'react';
import {connect} from 'react-redux';
import {dialog} from 'remote';
import ReactDOM from 'react-dom';
import FolderSelector from '../ui/FolderSelector';
import Item from './openproject/Item';
import {
    LEFT_CHANGE_CLUMTYPE,
    command,
    addLog,
    COLOR_RED,
    COLOR_GREEN,
    OPEN_RUFF_PROJECT, REMOVE_RUFF_PROJECT
} from '../../actions/AppActions';
import {tr, cutCharByLength} from '../../lib/Utils';
var fs = require('fs');
var path = require('path');
import {escapePath} from '../../lib/FileUtil';
class C2_OpenProject extends React.Component {
    constructor(props) {
        super(props)
        this.idxAniEnd = 0;
    }

    componentDidMount() {
        // console.log('componentDidMount')
        //初始化渲染执行之后立刻调用
        let self = this;
        var tree = ReactDOM.findDOMNode(this.refs['tree']);
        // console.log('treeL',tree)
        tree.addEventListener('webkitAnimationEnd', function (e) {
            if (self.props.type != 2) {
                return;
            }
            self.idxAniEnd += 1;
            // console.log(self.idxAniEnd, self.props.histrory.size)

            if (self.idxAniEnd > self.props.histrory.size) {//动画结束，关闭面板
                self.idxAniEnd = 0;
                command(LEFT_CHANGE_CLUMTYPE, {key: self.props.clumId, value: 0});
            }
        })
    }

    onOpenFolderEnd(openPath) {
        // this.isOpen = false;
        // console.log('打开文件夹的路径:', openPath);
        // console.log('历史记录:', this.props.histrory);
        var hisExist = false;//历史里是否有
        var projectPath = escapePath(openPath);
        // console.log('escapePath:', projectPath);
        for (let i = 0, len = this.props.histrory.size; i < len; i++) {
            if (projectPath == this.props.histrory.get(i).path) {
                hisExist = true;
                break;
            }
        }

        if (!hisExist || this.props.ruffProjectPath != projectPath) {//打开了新的文件夹
            var files = ['app.json', 'package.json', 'ruff_modules'];
            var existProject = true;
            for (var i = 0, len = files.length; i < len; i++) {
                var filePath = projectPath + '\\' + files[i];
                // console.log('filePath:',filePath,fs.existsSync(escapePath(filePath)));
                if (!fs.existsSync(escapePath(filePath))) {//判断文件是否存在
                    existProject = false;
                    break;
                }
            }
            if (existProject) {//是ruff项目
                var baseName = path.basename(projectPath);
                addLog(tr(204, baseName), COLOR_GREEN);//204 切换至项目【xxx】
                command(OPEN_RUFF_PROJECT, {name: baseName, path: projectPath});

            } else {
                addLog(tr(203), COLOR_RED);//不是有效的 ruff 项目
            }
            // console.log('existProject:', existProject)
        } else {//打开的还是当前的项目
            var baseName = path.basename(projectPath);
            addLog(tr(204, baseName), COLOR_GREEN);//204 切换至项目【xxx】
        }
    }

    getOpenButton() {//打开项目的按钮
        var type = this.props.type;
        // console.log('type:', type)
        if (type == 0) {
            return <div/>
        }
        if (type == 1) {
            var style = {
                animation: `alphaShow  0.6s ease`,
                animationFillMode: 'both'
            };
        } else if (type == 2) {
            style = {
                animation: `alphaClose 0.3s ease`,
                animationFillMode: 'forwards'
            };
        }
        // tr(1) 选择ruff项目
        return <div style={style}>
            <FolderSelector defaultValue={tr(1)} style={{
                margin: '4px 0 4px 10px', width: '128px',
                padding:'3px 0 3px 0'
            }} openFolderCallBack={this.onOpenFolderEnd.bind(this)}/>
        </div>
    }

    /**从历史记录里打开项目*/
    onOpenProjectByHistrory(_path) {
        if (fs.existsSync(_path)) {//判断Egret json文件是否存在
            // addLog(tr(204, baseName), COLOR_GREEN);//204 切换至项目【xxx】
            this.onOpenFolderEnd(_path);//存在项目，打开
        } else {
            addLog(tr(205, _path), COLOR_RED);//205--路径不存在
            command(REMOVE_RUFF_PROJECT, {path: _path});//移除路径
        }
    }

    getHistrory() {
        var aniType = this.props.type;
        // console.log('type:', type)
        if (aniType == 0) {
            return <div/>
        }
        return this.props.histrory.map((item, index)=> {
            return <Item key={"hisItem" + index} index={index} item={item} aniType={aniType}
                         clickCallBack={this.onOpenProjectByHistrory.bind(this)}/>
        })
    }

    render() {
        //tr 1 选择ruff项目
        // console.log('open:',this.props)
        return (
            <div className="mousePointer" ref="tree">
                {this.getOpenButton()}
                <div >
                    {this.getHistrory()}
                </div>

            </div>
        )
    }
}
function select(state) {
    return {
        type: state.left.clum2,
        ruffProjectPath: state.config.ruffProjectPath,
        histrory: state.config.histrory
    }
}
export default connect(select)(C2_OpenProject);
C2_OpenProject.propTypes = {
    clumId: PropTypes.number.isRequired//栏目的id
}