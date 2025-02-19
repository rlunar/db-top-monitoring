import { useState,useEffect,useRef } from 'react';
import Axios from 'axios';
import { configuration } from './Configs';
import { useSearchParams } from 'react-router-dom';
import CustomHeader from "../components/Header";
import AppLayout from "@awsui/components-react/app-layout";
import Box from "@awsui/components-react/box";
import Tabs from "@awsui/components-react/tabs";
import ColumnLayout from "@awsui/components-react/column-layout";
import { SplitPanel } from '@awsui/components-react';

import Pagination from "@awsui/components-react/pagination";
import Link from "@awsui/components-react/link";
import Header from "@awsui/components-react/header";
import Container from "@awsui/components-react/container";
import ElasticNode  from '../components/CompElasticNode01';
import CompMetric01  from '../components/Metric01';
import ChartLine02  from '../components/ChartLine02';
import CLWChart  from '../components/ChartCLW03';
import ChartRadialBar01 from '../components/ChartRadialBar01';
import ChartColumn01 from '../components/ChartColumn01';

export const splitPanelI18nStrings: SplitPanelProps.I18nStrings = {
  preferencesTitle: 'Split panel preferences',
  preferencesPositionLabel: 'Split panel position',
  preferencesPositionDescription: 'Choose the default split panel position for the service.',
  preferencesPositionSide: 'Side',
  preferencesPositionBottom: 'Bottom',
  preferencesConfirm: 'Confirm',
  preferencesCancel: 'Cancel',
  closeButtonAriaLabel: 'Close panel',
  openButtonAriaLabel: 'Open panel',
  resizeHandleAriaLabel: 'Resize split panel',
};

var CryptoJS = require("crypto-js");


function App() {
    
    //-- Gather Parameters
    const [params]=useSearchParams();
    
    //--######## Global Settings
    
    //-- Variable for Active Tabs
    const [activeTabId, setActiveTabId] = useState("tab01");
    const currentTabId = useRef("tab01");
    
    
    const parameter_code_id=params.get("code_id");  
    const parameter_id=params.get("session_id");  
    var parameter_object_bytes = CryptoJS.AES.decrypt(parameter_id, parameter_code_id);
    var parameter_object_values = JSON.parse(parameter_object_bytes.toString(CryptoJS.enc.Utf8));
    
    //-- Configuration variables
    const cnf_connection_id=parameter_object_values["session_id"];  
    const cnf_identifier=parameter_object_values["rds_id"];  
    const cnf_username=parameter_object_values["rds_user"];
    const cnf_password=parameter_object_values["rds_password"];
    const cnf_auth=parameter_object_values["rds_auth"];
    const cnf_ssl=parameter_object_values["rds_ssl"];
    
    //-- Add token header
    Axios.defaults.headers.common['x-token'] = sessionStorage.getItem(cnf_connection_id);
    Axios.defaults.headers.common['x-token-cognito'] = sessionStorage.getItem("x-token-cognito");
    
    //-- Set Page Title
    document.title = configuration["apps-settings"]["application-title"] + ' - ' + cnf_identifier;
   

    //--######## RealTime Metric Features
    
    //-- Variable for Split Panels
    const [splitPanelShow,setsplitPanelShow] = useState(false);
    const [metricDetailsIndex,setMetricDetailsIndex] = useState({index : 'cpu', title : 'CPU Usage(%)', timestamp : 0 });
    
    
    //-- Variable for Paging
    const [currentPageIndex,setCurrentPageIndex] = useState(1);
    var pageId = useRef(1);
    var itemsPerPage = configuration["apps-settings"]["items-per-page"];
    var totalPages = Math.trunc( parameter_object_values['rds_nodes'] / itemsPerPage) + (  parameter_object_values['rds_nodes'] % itemsPerPage != 0 ? 1 : 0 ) 
    
    //-- Variable for Cluster Stats
    var timeNow = new Date();
    const nodeList = useRef("");
    const [clusterStats,setClusterStats] = useState({ 
                                cluster : {
                                            cpu: 0,
                                            memory: 0,
                                            memoryUsed: 0,
                                            memoryTotal: 0,
                                            operations: 0,
                                            getCalls: 0,
                                            setCalls: 0,
                                            connectedClients: 0,
                                            getLatency: 0,
                                            setLatency: 0,
                                            keyspaceHits: 0,
                                            keyspaceMisses: 0,
                                            cacheHitRate : 0,
                                            netIn: 0,
                                            netOut: 0,
                                            connectionsTotal: 0,
                                            commands: 0,
                                            history : {
                                                operations : [],
                                                getCalls : [],
                                                setCalls : [],
                                                getLatency : [],
                                                setLatency : [],
                                                keyspaceHits : [],
                                                keyspaceMisses : [],
                                            }
                                },
                                nodes : [],
                });
    
    
    
    
    
    //-- Function Gather Metrics
    async function openClusterConnection() {
        
        var api_url = configuration["apps-settings"]["api_url"];
        Axios.defaults.headers.common['x-csrf-token'] = sessionStorage.getItem("x-csrf-token");
        await Axios.post(`${api_url}/api/redis/elasticache/cluster/connection/open/`,{
                      params: { 
                                connectionId : cnf_connection_id,
                                clusterId : cnf_identifier,
                                username : cnf_username,
                                password : cnf_password,
                                auth : cnf_auth,
                                ssl : cnf_ssl,
                             }
              }).then((data)=>{
                
                nodeList.current = data.data.nodes;
                  
              })
              .catch((err) => {
                  console.log('Timeout API Call : /api/redis/elasticache/cluster/connection/open/' );
                  console.log(err);
                  
              });
              
    }
    
    //-- Function Cluster Update Stats
    async function updateClusterStats() {
        
        var api_url = configuration["apps-settings"]["api_url"];
        
        Axios.get(`${api_url}/api/redis/cluster/stats/update`,{
                      params: { connectionId : cnf_connection_id, clusterId : cnf_identifier }
                  }).then((data)=>{
                   
                   
              })
              .catch((err) => {
                  console.log('Timeout API Call : /api/redis/cluster/stats/update' );
                  console.log(err);
                  
              });
              
    }
    


    //-- Function Cluster Gather Stats
    async function gatherClusterStats() {
        
        if (currentTabId.current != "tab01") {
            return;
        }
        
        var api_url = configuration["apps-settings"]["api_url"];
        
        Axios.get(`${api_url}/api/redis/cluster/stats/gather`,{
                      params: { connectionId : cnf_connection_id, clusterId : cnf_identifier, beginItem : ( (pageId.current-1) * itemsPerPage), endItem : (( (pageId.current-1) * itemsPerPage) + itemsPerPage) }
                  }).then((data)=>{
                   
                   setClusterStats({
                         cluster : data.data.cluster,
                         nodes : data.data.nodes,
                    });
                     
              })
              .catch((err) => {
                  console.log('Timeout API Call : /api/redis/cluster/stats/gather' );
                  console.log(err);
                  
              });
              
        
        
    }



    useEffect(() => {
        openClusterConnection();
    }, []);
    
    useEffect(() => {
        const id = setInterval(updateClusterStats, configuration["apps-settings"]["refresh-interval-elastic"]);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    
    useEffect(() => {
        const id = setInterval(gatherClusterStats, configuration["apps-settings"]["refresh-interval-elastic"]);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    
    
    //-- Function Handle Logout
   const handleClickMenu = ({detail}) => {
          
            switch (detail.id) {
              case 'signout':
                  closeDatabaseConnection();
                break;
                
              case 'other':
                break;
                
              
            }

    };
    
    //-- Function Handle Logout
   const handleClickDisconnect = () => {
          closeDatabaseConnection();
    };
    
    
    //-- Close Database Connection
    
    const closeDatabaseConnection = () => {
        
        Axios.get(`${configuration["apps-settings"]["api_url"]}/api/redis/connection/close/`,{
                      params: { connectionId : cnf_connection_id, clusterId : cnf_identifier }
                  }).then((data)=>{
                      closeTabWindow();
                      sessionStorage.removeItem(parameter_code_id);
                  })
                  .catch((err) => {
                      console.log('Timeout API Call : /api/redis/connection/close/');
                      console.log(err)
                  });
                  
  
      
    }
       
    //-- Close TabWindow
    const closeTabWindow = () => {
              window.opener = null;
              window.open("", "_self");
              window.close();
      
    }
    

    function onClickMetric(metricId,metricTitle) {
        
        var timeNow = new Date();
        
        setMetricDetailsIndex ({ index : metricId, title : metricTitle, timestamp : timeNow.getTime() });
        setsplitPanelShow(true);
                                                      
    }
    
    function metricDetailsToColumnsBar(nodes,columnName){
        
        var seriesRaw = [];  
        var seriesData = { categories : [], data : [] };  
        try {  
                if (nodes.length > 0){
                    nodes.forEach(function(node) {
                        seriesRaw.push({ name : node.name, value :  node.history[columnName].data[node.history[columnName].data.length-1]  }  );
                    });
                
                    var itemLimit = 0;
                    var data = [];
                    var categories = [];
                    seriesRaw.sort((a, b) => b.value - a.value);
                    seriesRaw.forEach(function(item, index) {
                        if (itemLimit < 5) {
                            categories.push(item.name);
                            data.push(Math.trunc(item.value));
                        }
                        itemLimit++;
                    });
                    
                    seriesData = { categories : categories, data : data };  
                    
                
                }
        }
        catch{
            
        }
        
        return seriesData;
    }
    
    
    function metricDetailsToColumnsLine(nodes,columnName){
        
        var data = [];
        nodes.forEach(function(node) {
                
                data.push({ name : node.name, data : node.history[columnName].data });
        });
        
        return data;
        
        
    }
 

  return (
    <div style={{"background-color": "#121b29"}}>
    
        <CustomHeader
            onClickMenu={handleClickMenu}
            onClickDisconnect={handleClickDisconnect}
            sessionInformation={parameter_object_values}
        />
        
        <AppLayout
        headerSelector="#h"
        contentType="table"
        disableContentPaddings={true}
        toolsHide={true}
        navigationHide={true}
        splitPanelOpen={splitPanelShow}
        onSplitPanelToggle={() => setsplitPanelShow(false)}
        splitPanelSize={300}
        splitPanel={
                  <SplitPanel  header={metricDetailsIndex.title} i18nStrings={splitPanelI18nStrings} closeBehavior="hide"
                    onSplitPanelToggle={({ detail }) => {
                                    
                                    }
                                  }
                  >
                     
                    { splitPanelShow === true &&
                    
                    <table style={{"width":"100%", "padding": "1em"}}>
                        <tr>  
                            <td style={{"width":"30%", "padding-left": "1em"}}>  
                                
                                <ChartColumn01 
                                    series={metricDetailsToColumnsBar(clusterStats['nodes'],metricDetailsIndex.index)} 
                                    height="200px" 
                                />
                                
                            </td>
                            <td style={{"width":"70%", "padding-left": "1em"}}>  
                                 <ChartLine02 
                                    series={JSON.stringify(metricDetailsToColumnsLine(clusterStats['nodes'],metricDetailsIndex.index))} 
                                    timestamp={metricDetailsIndex.timestamp} 
                                    height="200px" 
                                  />
                            </td>
                        </tr>
                    </table>
                     
                    }
                        
                        
                  </SplitPanel>
        }
        content={
            <>              
                            <table style={{"width":"100%"}}>
                                <tr>  
                                    <td style={{"width":"50%","padding-left": "1em", "border-left": "10px solid " + configuration.colors.lines.separator100,}}>  
                                        <Box variant="h2" color="text-status-inactive" >{parameter_object_values['rds_host']}</Box>
                                    </td>
                                </tr>
                            </table>
                            
                            <Tabs
                                    onChange={({ detail }) => {
                                          setActiveTabId(detail.activeTabId);
                                          currentTabId.current=detail.activeTabId;
                                          setsplitPanelShow(false);
                                      }
                                    }
                                    activeTabId={activeTabId}
                                    tabs={[
                                      {
                                        label: "RealTime Metrics",
                                        id: "tab01",
                                        content: 
                                          
                                          <>
                                            <table style={{"width":"100%", "padding": "1em", "background-color ": "black"}}>
                                                <tr>  
                                                   <td> 
                                                        <Container
                                                                 header={
                                                                                <Header
                                                                                  variant="h2"
                                                                                >
                                                                                  Performance Metrics
                                                                                </Header>
                                                                            }
                                                        >
                                
                                                                <table style={{"width":"100%"}}>
                                                                    <tr>  
                                                                        <td style={{"width":"12%", "padding-left": "1em"}}>  
                                                                                <CompMetric01 
                                                                                    value={clusterStats['cluster']['operations'] || 0}
                                                                                    title={"Operations/sec"}
                                                                                    precision={0}
                                                                                    format={1}
                                                                                    fontColorValue={configuration.colors.fonts.metric100}
                                                                                    fontSizeValue={"30px"}
                                                                                />
                                                                        </td>
                                                                         <td style={{"width":"10%", "padding-left": "1em"}}>  
                                                                                <CompMetric01 
                                                                                    value={clusterStats['cluster']['getLatency'] || 0}
                                                                                    title={"getLatency(us)"}
                                                                                    precision={0}
                                                                                    format={1}
                                                                                    fontColorValue={configuration.colors.fonts.metric100}
                                                                                />
                                                                                <br/>        
                                                                                <br/> 
                                                                                <CompMetric01 
                                                                                    value={clusterStats['cluster']['setLatency']|| 0}
                                                                                    title={"setLatency(us)"}
                                                                                    precision={0}
                                                                                    format={1}
                                                                                    fontColorValue={configuration.colors.fonts.metric100}
                                                                                />
                                                                        </td>
                                                                        <td style={{"width":"12%", "padding-left": "1em"}}>  
                                                                                <ChartRadialBar01 series={JSON.stringify([Math.round(clusterStats['cluster']['cpu'] || 0)])} 
                                                                                         height="180px" 
                                                                                         title={"CPU (%)"}
                                                                                />
                                                                             
                                                                        </td>
                                                                        <td style={{"width":"12%", "padding-left": "1em"}}>  
                                                                                <ChartRadialBar01 series={JSON.stringify([Math.round(clusterStats['cluster']['memory'] || 0)])} 
                                                                                         height="180px" 
                                                                                         title={"Memory (%)"}
                                                                                />
                                                                        </td>
                                                                        <td style={{"width":"12%", "padding-left": "1em"}}>  
                                                                                <ChartRadialBar01 series={JSON.stringify([Math.round(clusterStats['cluster']['network'] || 0)])} 
                                                                                         height="180px" 
                                                                                         title={"Network (%)"}
                                                                                />
                                                                        </td>
                                                                        <td style={{"width":"12%", "padding-right": "1em"}}>  
                                                                                <ChartRadialBar01 series={JSON.stringify([ Math.round( clusterStats['cluster']['cacheHitRate'] || 0 ) ])} 
                                                                                         height="180px" 
                                                                                         title={"HitRatio (%)"}
                                                                                />
                                                                        </td>
                                                                        <td style={{"width":"30%", "border-left": "1px solid red", "padding-left": "1em"}}>  
                                                                             <ChartLine02 series={JSON.stringify([
                                                                                                    clusterStats['cluster']['history']['operations']
                                                                                                ])} 
                                                                                                title={"Operations/sec"} height="180px" />
                                                                            {/*
                                                                            <ChartBar01 series={[
                                                                                                    dataMetrics.refObject.getPropertyValues('Operations')
                                                                                                ]} 
                                                                             timestamp={dataMetrics.timestamp} title={"Operations/sec"} height="180px" 
                                                                             />
                                                                             */}
                                                                        </td>
                                                                        
                                                                    </tr>
                                                                    
                                                                </table>  
                                                                
                                                                <br />
                                                                <br />
                                                                <br />
                                                                <table style={{"width":"100%"}}>
                                                                    <tr> 
                                                                        <td style={{"width":"12.5%",  "padding-left": "1em"}}>  
                                                                            <CompMetric01 
                                                                                value={clusterStats['cluster']['getCalls'] || 0}
                                                                                title={"getCalls/sec"}
                                                                                precision={0}
                                                                                format={1}
                                                                                fontColorValue={configuration.colors.fonts.metric100}
                                                                            />
                                                                        </td>
                                                                        <td style={{"width":"12.5%", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"}}>  
                                                                            <CompMetric01 
                                                                                value={clusterStats['cluster']['setCalls'] || 0}
                                                                                title={"setCalls/sec"}
                                                                                precision={0}
                                                                                format={1}
                                                                                fontColorValue={configuration.colors.fonts.metric100}
                                                                            />
                                                                        </td>
                                                                        <td style={{"width":"12.5%", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"}}>  
                                                                                <CompMetric01 
                                                                                    value={clusterStats['cluster']['memoryTotal'] || 0}
                                                                                    title={"MemoryTotal"}
                                                                                    precision={0}
                                                                                    format={2}
                                                                                    fontColorValue={configuration.colors.fonts.metric100}
                                                                                />
                                                                        </td>
                                                                        <td style={{"width":"12.5%", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"}}>  
                                                                            <CompMetric01 
                                                                                value={clusterStats['cluster']['keyspaceHits'] || 0}
                                                                                title={"Cache Hits/sec"}
                                                                                precision={0}
                                                                                format={1}
                                                                                fontColorValue={configuration.colors.fonts.metric100}
                                                                            />
                                                                        </td>
                                                                        <td style={{"width":"12.5%", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"}}>  
                                                                            <CompMetric01 
                                                                                value={clusterStats['cluster']['netIn'] || 0}
                                                                                title={"NetworkIn"}
                                                                                precision={0}
                                                                                format={2}
                                                                                fontColorValue={configuration.colors.fonts.metric100}
                                                                            />
                                                                        </td>
                                                                        <td style={{"width":"12.5%", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"}}>  
                                                                            <CompMetric01 
                                                                                value={clusterStats['cluster']['netOut'] || 0}
                                                                                title={"NetworkOut"}
                                                                                precision={0}
                                                                                format={2}
                                                                                fontColorValue={configuration.colors.fonts.metric100}
                                                                            />
                                                                        </td>
                                                                        <td style={{"width":"12.5%", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"}}>  
                                                                                <CompMetric01 
                                                                                    value={clusterStats['cluster']['connectionsTotal'] || 0}
                                                                                    title={"Connections/sec"}
                                                                                    precision={0}
                                                                                    format={1}
                                                                                    fontColorValue={configuration.colors.fonts.metric100}
                                                                                />
                                                                        </td>
                                                                        <td style={{"width":"12.5%", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"}}>  
                                                                            <CompMetric01 
                                                                                value={clusterStats['cluster']['connectedClients'] || 0}
                                                                                title={"CurConnections"}
                                                                                precision={0}
                                                                                format={3}
                                                                                fontColorValue={configuration.colors.fonts.metric100}
                                                                            />
                                                                        </td>
                                                                        
                                                                    </tr>
                                                                    
                                                            </table>  
                                                                
                                                            <br />
                                                            <br />
                                                            <br />
                                                              <table style={{"width":"100%"}}>
                                                                  <tr>  
                                                                    <td style={{"width":"33%","padding-left": "1em"}}> 
                                                                            <ChartLine02 series={JSON.stringify([
                                                                                                    clusterStats['cluster']['history']['getCalls'],
                                                                                                    clusterStats['cluster']['history']['setCalls']
                                                                                                ])} 
                                                                                                title={"Calls/sec"} height="230px" />
                                                                    </td>
                                                                    
                                                                    <td style={{"width":"33%","padding-left": "1em"}}> 
                                                                            <ChartLine02 series={JSON.stringify([
                                                                                                    clusterStats['cluster']['history']['getLatency'],
                                                                                                    clusterStats['cluster']['history']['setLatency']
                                                                                                ])} 
                                                                                                title={"CallsLatency(us)"} height="230px" />
                                                                    </td>
                                                                    <td style={{"width":"33%","padding-left": "1em"}}> 
                                                                            <ChartLine02 series={JSON.stringify([
                                                                                                    clusterStats['cluster']['history']['keyspaceHits'],
                                                                                                    clusterStats['cluster']['history']['keyspaceMisses'],
                                                                                                ])} 
                                                                                                title={"Cache Efficiency/sec"} height="230px" />
                                                                    </td>
                                                                    
                                                                  </tr>
                                                              </table>
                                                                
                                                            
                                                        </Container>
                                                        <br/>
                                                        <Container
                                                        
                                                                    header={
                                                                            <Header
                                                                              variant="h2"
                                                                              actions={
                                                                                    <Pagination
                                                                                          currentPageIndex={currentPageIndex}
                                                                                          onChange={({ detail }) => {
                                                                                                    setCurrentPageIndex(detail.currentPageIndex);
                                                                                                    pageId.current = detail.currentPageIndex;
                                                                                                    gatherClusterStats();
                                                                                            }
                                                                                          }
                                                                                          pagesCount={ totalPages } 
                                                                                    />
                                                                                  
                                                                              }
                                                                            >
                                                                              Instances
                                                                            </Header>
                                                                        }
                                                        >
                                                            
                                                            <table style={{"width":"100%" }}>
                                                                        <tr>
                                                                            <td style={{ "width":"9%", "text-align":"left","padding-left":"1em", "font-size": "12px", "font-weight": "600"}}>
                                                                                    NodeId
                                                                            </td>
                                                                            <td style={{ "width":"9%", "text-align":"center","font-size": "12px", "font-weight": "600", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"}}>
                                                                                <Link fontSize="body-s" onFollow={() => onClickMetric('operations','Operations/sec')}>Operations/sec</Link>
                                                                            </td>
                                                                            <td style={{ "width":"9%", "text-align":"center","font-size": "12px", "font-weight": "600", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"}}>
                                                                                <Link fontSize="body-s" onFollow={() => onClickMetric('getCalls','getCalls/sec')}>getCalls/sec</Link>
                                                                            </td>
                                                                            <td style={{ "width":"9%", "text-align":"center","font-size": "12px", "font-weight": "600", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"}}>
                                                                                <Link fontSize="body-s" onFollow={() => onClickMetric('setCalls','setCalls/sec')}>setCalls/sec</Link>
                                                                            </td>
                                                                            <td style={{ "width":"9%", "text-align":"center","font-size": "12px", "font-weight": "600", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"}}>
                                                                                <Link fontSize="body-s" onFollow={() => onClickMetric('cacheHitRate','CacheHitRate(%)')}>CacheHitRate(%)</Link>
                                                                            </td>
                                                                            <td style={{ "width":"9%", "text-align":"center","font-size": "12px", "font-weight": "600", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"}}>
                                                                                <Link fontSize="body-s" onFollow={() => onClickMetric('getLatency','getLatency(us)')}> getLatency(us)</Link>
                                                                            </td>
                                                                            <td style={{ "width":"9%", "text-align":"center","font-size": "12px", "font-weight": "600", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"}}>
                                                                                <Link fontSize="body-s" onFollow={() => onClickMetric('setLatency','setLatency(us)')}>setLatency(us)</Link>
                                                                            </td>
                                                                            <td style={{ "width":"9%", "text-align":"center","font-size": "12px", "font-weight": "600", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"}}>
                                                                                <Link fontSize="body-s" onFollow={() => onClickMetric('connectedClients','Connections')}>Connections</Link>
                                                                            </td>
                                                                            <td style={{ "width":"9%", "text-align":"center","font-size": "12px", "font-weight": "600", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"}}>
                                                                                <Link fontSize="body-s" onFollow={() =>  onClickMetric('cpu','CPU Usage(%)')}>CPU Usage(%)</Link>
                                                                            </td>
                                                                            <td style={{ "width":"9%", "text-align":"center","font-size": "12px", "font-weight": "600", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"}}>
                                                                                <Link fontSize="body-s" onFollow={() => onClickMetric('memory','Memory Usage(%)')}>Memory Usage(%)</Link>
                                                                            </td>
                                                                            <td style={{ "width":"9%", "text-align":"center","font-size": "12px", "font-weight": "600", "border-left": "2px solid " + configuration.colors.lines.separator100, "padding-left": "1em"}}>
                                                                                <Link fontSize="body-s" onFollow={() => onClickMetric('network','Network Usage(%)')}>Network Usage(%)</Link>
                                                                            </td>
                                                                            
                                                                        </tr>
                                                                                
                                                                        {clusterStats['nodes'].map((item,key) => (
                                                                                                 <ElasticNode
                                                                                                    connectionId = {cnf_connection_id}
                                                                                                    clusterId = {cnf_identifier}
                                                                                                    nodeId = {item.nodeId}
                                                                                                    instance = {item.endPoint}
                                                                                                    port={item.port}
                                                                                                    username = {cnf_username}
                                                                                                    password = {cnf_password}
                                                                                                    auth = {cnf_auth}
                                                                                                    ssl = {cnf_ssl}
                                                                                                    node = {item}
                                                                                                />
                                                                           
                                                                           
                                                                            ))}
                                                                        
                                                            </table>
                                                
                                                        </Container>
                                                    </td>
                                                </tr>
                                            </table>  
                                                
                                                
                                          </>
                                          
                                      },
                                      {
                                        label: "CloudWatch Metrics",
                                        id: "tab02",
                                        content: 
                                          
                                          <>    
                                                
                                                <table style={{"width":"100%", "padding": "1em", "background-color ": "black"}}>
                                                <tr>  
                                                   <td> 
                                                   
                                                        <Container
                                                                
                                                                header={
                                                                                <Header
                                                                                  variant="h2"
                                                                                  description={"AWS CloudWatch metrics from last 60 minutes."}
                                                                                  actions={
                                                                                        <Pagination
                                                                                                  currentPageIndex={currentPageIndex}
                                                                                                  onChange={({ detail }) => {
                                                                                                            setCurrentPageIndex(detail.currentPageIndex);
                                                                                                            pageId.current = detail.currentPageIndex;
                                                                                                    }
                                                                                                  }
                                                                                                  pagesCount={ totalPages } 
                                                                                        />
                                                                                  }
                                                                                >
                                                                                  Performance Metrics
                                                                                </Header>
                                                                            }
                                                        
                                                        >
                                                            <CLWChart
                                                                  title="CPU Utilization % " 
                                                                  subtitle="Average" 
                                                                  height="180px" 
                                                                  color="purple" 
                                                                  namespace="AWS/ElastiCache" 
                                                                  dimension_name={"CacheClusterId|CacheNodeId"}
                                                                  dimension_value={nodeList.current}
                                                                  metric_name="CPUUtilization"
                                                                  stat_type="Average"
                                                                  period={60} 
                                                                  interval={(60*1) * 60000}
                                                                  current_metric_mode={"average"}
                                                                  metric_precision={0}
                                                                  format={2}
                                                                  font_color_value={configuration.colors.fonts.metric100}
                                                                  pageId={pageId.current}
                                                                  itemsPerPage={itemsPerPage}
                                                            />
                                                            <br/>
                                                            <br/>
                                                            <br/>
                                                            <br/>
                                                            <br/>
                                                            <CLWChart
                                                                  title="Engine CPU Utilization % " 
                                                                  subtitle="Average" 
                                                                  height="180px" 
                                                                  color="purple" 
                                                                  namespace="AWS/ElastiCache" 
                                                                  dimension_name={"CacheClusterId|CacheNodeId"}
                                                                  dimension_value={nodeList.current}
                                                                  metric_name="EngineCPUUtilization"
                                                                  stat_type="Average"
                                                                  period={60} 
                                                                  interval={(60*1) * 60000}
                                                                  current_metric_mode={"average"}
                                                                  metric_precision={0}
                                                                  format={2}
                                                                  font_color_value={configuration.colors.fonts.metric100}
                                                                  pageId={pageId.current}
                                                                  itemsPerPage={itemsPerPage}
                                                            />
                                                            <br/>
                                                            <br/>
                                                            <br/>
                                                            <br/>
                                                            <br/>
                                                            <CLWChart
                                                                  title="Database Memory Usage Percentage % " 
                                                                  subtitle="Average" 
                                                                  height="180px" 
                                                                  color="purple" 
                                                                  namespace="AWS/ElastiCache" 
                                                                  dimension_name={"CacheClusterId|CacheNodeId"}
                                                                  dimension_value={nodeList.current}
                                                                  metric_name="DatabaseMemoryUsagePercentage"
                                                                  stat_type="Average"
                                                                  period={60} 
                                                                  interval={(60*1) * 60000}
                                                                  current_metric_mode={"average"}
                                                                  metric_precision={0}
                                                                  format={2}
                                                                  font_color_value={configuration.colors.fonts.metric100}
                                                                  pageId={pageId.current}
                                                                  itemsPerPage={itemsPerPage}
                                                            />
                                                            <br/>
                                                            <br/>
                                                            <br/>
                                                            <br/>
                                                            <br/>
                                                            <CLWChart
                                                                  title="Database Capacity Usage Percentage % " 
                                                                  subtitle="Average" 
                                                                  height="180px" 
                                                                  color="purple" 
                                                                  namespace="AWS/ElastiCache" 
                                                                  dimension_name={"CacheClusterId|CacheNodeId"}
                                                                  dimension_value={nodeList.current}
                                                                  metric_name="DatabaseCapacityUsagePercentage"
                                                                  stat_type="Average"
                                                                  period={60} 
                                                                  interval={(60*1) * 60000}
                                                                  current_metric_mode={"average"}
                                                                  metric_precision={0}
                                                                  format={2}
                                                                  font_color_value={configuration.colors.fonts.metric100}
                                                                  pageId={pageId.current}
                                                                  itemsPerPage={itemsPerPage}
                                                            />
                                                            <br/>
                                                            <br/>
                                                            <br/>
                                                            <br/>
                                                            <br/>
                                                            <CLWChart
                                                                  title="Network Bytes In" 
                                                                  subtitle="Total" 
                                                                  height="180px" 
                                                                  color="purple" 
                                                                  namespace="AWS/ElastiCache" 
                                                                  dimension_name={"CacheClusterId|CacheNodeId"}
                                                                  dimension_value={nodeList.current}
                                                                  metric_name="NetworkBytesIn"
                                                                  stat_type="Average"
                                                                  period={60} 
                                                                  interval={(60*1) * 60000}
                                                                  current_metric_mode={"total"}
                                                                  metric_precision={0}
                                                                  format={2}
                                                                  font_color_value={configuration.colors.fonts.metric100}
                                                                  pageId={pageId.current}
                                                                  itemsPerPage={itemsPerPage}
                                                            />
                                                            <br/>
                                                            <br/>
                                                            <br/>
                                                            <br/>
                                                            <br/>
                                                            <CLWChart
                                                                  title="Network Bytes Out" 
                                                                  subtitle="Total" 
                                                                  height="180px" 
                                                                  color="purple" 
                                                                  namespace="AWS/ElastiCache" 
                                                                  dimension_name={"CacheClusterId|CacheNodeId"}
                                                                  dimension_value={nodeList.current}
                                                                  metric_name="NetworkBytesOut"
                                                                  stat_type="Average"
                                                                  period={60} 
                                                                  interval={(60*1) * 60000}
                                                                  current_metric_mode={"total"}
                                                                  metric_precision={0}
                                                                  format={2}
                                                                  font_color_value={configuration.colors.fonts.metric100}
                                                                  pageId={pageId.current}
                                                                  itemsPerPage={itemsPerPage}
                                                            />
                                                            <br/>
                                                            <br/>
                                                            <br/>
                                                            <br/>
                                                            <br/>
                                                            <CLWChart
                                                                  title="NetworkBandwidthInAllowanceExceeded" 
                                                                  subtitle="Total" 
                                                                  height="180px" 
                                                                  color="purple" 
                                                                  namespace="AWS/ElastiCache" 
                                                                  dimension_name={"CacheClusterId|CacheNodeId"}
                                                                  dimension_value={nodeList.current}
                                                                  metric_name="NetworkBandwidthInAllowanceExceeded"
                                                                  stat_type="Average"
                                                                  period={60} 
                                                                  interval={(60*1) * 60000}
                                                                  current_metric_mode={"total"}
                                                                  metric_precision={0}
                                                                  format={1}
                                                                  font_color_value={configuration.colors.fonts.metric100}
                                                                  pageId={pageId.current}
                                                                  itemsPerPage={itemsPerPage}
                                                            />
                                                            <br/>
                                                            <br/>
                                                            <br/>
                                                            <br/>
                                                            <br/>
                                                            <CLWChart
                                                                  title="NetworkBandwidthOutAllowanceExceeded" 
                                                                  subtitle="Total" 
                                                                  height="180px" 
                                                                  color="purple" 
                                                                  namespace="AWS/ElastiCache" 
                                                                  dimension_name={"CacheClusterId|CacheNodeId"}
                                                                  dimension_value={nodeList.current}
                                                                  metric_name="NetworkBandwidthOutAllowanceExceeded"
                                                                  stat_type="Average"
                                                                  period={60} 
                                                                  interval={(60*1) * 60000}
                                                                  current_metric_mode={"total"}
                                                                  metric_precision={0}
                                                                  format={1}
                                                                  font_color_value={configuration.colors.fonts.metric100}
                                                                  pageId={pageId.current}
                                                                  itemsPerPage={itemsPerPage}
                                                            />
                                                            <br/>
                                                            <br/>
                                                            <br/>
                                                            <br/>
                                                            <br/>
                                                            <CLWChart
                                                                  title="CurrConnections" 
                                                                  subtitle="Total" 
                                                                  height="180px" 
                                                                  color="purple" 
                                                                  namespace="AWS/ElastiCache" 
                                                                  dimension_name={"CacheClusterId|CacheNodeId"}
                                                                  dimension_value={nodeList.current}
                                                                  metric_name="CurrConnections"
                                                                  stat_type="Average"
                                                                  period={60} 
                                                                  interval={(60*1) * 60000}
                                                                  current_metric_mode={"total"}
                                                                  metric_precision={0}
                                                                  format={3}
                                                                  font_color_value={configuration.colors.fonts.metric100}
                                                                  pageId={pageId.current}
                                                                  itemsPerPage={itemsPerPage}
                                                            />
                                                            <br/>
                                                            <br/>
                                                            <br/>
                                                            <br/>
                                                            <br/>
                                                            <CLWChart
                                                                  title="Current Items" 
                                                                  subtitle="Total" 
                                                                  height="180px" 
                                                                  color="purple" 
                                                                  namespace="AWS/ElastiCache" 
                                                                  dimension_name={"CacheClusterId|CacheNodeId"}
                                                                  dimension_value={nodeList.current}
                                                                  metric_name="CurrItems"
                                                                  stat_type="Average"
                                                                  period={60} 
                                                                  interval={(60*1) * 60000}
                                                                  current_metric_mode={"total"}
                                                                  metric_precision={0}
                                                                  format={1}
                                                                  font_color_value={configuration.colors.fonts.metric100}
                                                                  pageId={pageId.current}
                                                                  itemsPerPage={itemsPerPage}
                                                            />
                                                            <br/>
                                                            <br/>
                                                            <br/>
                                                            <br/>
                                                            <br/>
                                                            <CLWChart
                                                                  title="GetTypeCmds" 
                                                                  subtitle="Total" 
                                                                  height="180px" 
                                                                  color="purple" 
                                                                  namespace="AWS/ElastiCache" 
                                                                  dimension_name={"CacheClusterId|CacheNodeId"}
                                                                  dimension_value={nodeList.current}
                                                                  metric_name="GetTypeCmds"
                                                                  stat_type="Average"
                                                                  period={60} 
                                                                  interval={(60*1) * 60000}
                                                                  current_metric_mode={"total"}
                                                                  metric_precision={0}
                                                                  format={1}
                                                                  font_color_value={configuration.colors.fonts.metric100}
                                                                  pageId={pageId.current}
                                                                  itemsPerPage={itemsPerPage}
                                                            />
                                                            <br/>
                                                            <br/>
                                                            <br/>
                                                            <br/>
                                                            <br/>
                                                            <CLWChart
                                                                  title="SetTypeCmds" 
                                                                  subtitle="Total" 
                                                                  height="180px" 
                                                                  color="purple" 
                                                                  namespace="AWS/ElastiCache" 
                                                                  dimension_name={"CacheClusterId|CacheNodeId"}
                                                                  dimension_value={nodeList.current}
                                                                  metric_name="SetTypeCmds"
                                                                  stat_type="Average"
                                                                  period={60} 
                                                                  interval={(60*1) * 60000}
                                                                  current_metric_mode={"total"}
                                                                  metric_precision={0}
                                                                  format={1}
                                                                  font_color_value={configuration.colors.fonts.metric100}
                                                                  pageId={pageId.current}
                                                                  itemsPerPage={itemsPerPage}
                                                            />
                                                            <br/>
                                                            <br/>
                                                            <br/>
                                                            <br/>
                                                            <br/>
                                                            <CLWChart
                                                                  title="GetTypeCmdsLatency" 
                                                                  subtitle="Total" 
                                                                  height="180px" 
                                                                  color="purple" 
                                                                  namespace="AWS/ElastiCache" 
                                                                  dimension_name={"CacheClusterId|CacheNodeId"}
                                                                  dimension_value={nodeList.current}
                                                                  metric_name="GetTypeCmdsLatency"
                                                                  stat_type="Average"
                                                                  period={60} 
                                                                  interval={(60*1) * 60000}
                                                                  current_metric_mode={"average"}
                                                                  metric_precision={0}
                                                                  format={1}
                                                                  font_color_value={configuration.colors.fonts.metric100}
                                                                  pageId={pageId.current}
                                                                  itemsPerPage={itemsPerPage}
                                                            />
                                                            <br/>
                                                            <br/>
                                                            <br/>
                                                            <br/>
                                                            <br/>
                                                            <CLWChart
                                                                  title="SetTypeCmdsLatency" 
                                                                  subtitle="Total" 
                                                                  height="180px" 
                                                                  color="purple" 
                                                                  namespace="AWS/ElastiCache" 
                                                                  dimension_name={"CacheClusterId|CacheNodeId"}
                                                                  dimension_value={nodeList.current}
                                                                  metric_name="SetTypeCmdsLatency"
                                                                  stat_type="Average"
                                                                  period={60} 
                                                                  interval={(60*1) * 60000}
                                                                  current_metric_mode={"average"}
                                                                  metric_precision={0}
                                                                  format={1}
                                                                  font_color_value={configuration.colors.fonts.metric100}
                                                                  pageId={pageId.current}
                                                                  itemsPerPage={itemsPerPage}
                                                            />
                                                            <br/>
                                                            <br/>
                                                            <br/>
                                                            <br/>
                                                            <br/>
                                                            <CLWChart
                                                                  title="CacheHits" 
                                                                  subtitle="Total" 
                                                                  height="180px" 
                                                                  color="purple" 
                                                                  namespace="AWS/ElastiCache" 
                                                                  dimension_name={"CacheClusterId|CacheNodeId"}
                                                                  dimension_value={nodeList.current}
                                                                  metric_name="CacheHits"
                                                                  stat_type="Average"
                                                                  period={60} 
                                                                  interval={(60*1) * 60000}
                                                                  current_metric_mode={"total"}
                                                                  metric_precision={0}
                                                                  format={1}
                                                                  font_color_value={configuration.colors.fonts.metric100}
                                                                  pageId={pageId.current}
                                                                  itemsPerPage={itemsPerPage}
                                                            />
                                                            <br/>
                                                            <br/>
                                                            <br/>
                                                            <br/>
                                                            <br/>
                                                            <CLWChart
                                                                  title="CacheHitRate" 
                                                                  subtitle="Total" 
                                                                  height="180px" 
                                                                  color="purple" 
                                                                  namespace="AWS/ElastiCache" 
                                                                  dimension_name={"CacheClusterId|CacheNodeId"}
                                                                  dimension_value={nodeList.current}
                                                                  metric_name="CacheHitRate"
                                                                  stat_type="Average"
                                                                  period={60} 
                                                                  interval={(60*1) * 60000}
                                                                  current_metric_mode={"average"}
                                                                  metric_precision={0}
                                                                  format={1}
                                                                  font_color_value={configuration.colors.fonts.metric100}
                                                                  pageId={pageId.current}
                                                                  itemsPerPage={itemsPerPage}
                                                            />
                                                            
                                                            
                                                        </Container>
                                                
                                                    </td>
                                                </tr>
                                            </table> 
                                            
                                          </>
                                          
                                      },
                                      {
                                        label: "Cluster Information",
                                        id: "tab03",
                                        content: 
                                         
                                          <>
                                                 
                                              <table style={{"width":"100%", "padding": "1em", "background-color ": "black"}}>
                                                    <tr>  
                                                        <td>
                                                                <Container 
                                                                        header={
                                                                                <Header
                                                                                  variant="h2"
                                                                                >
                                                                                  Configuration
                                                                                </Header>
                                                                        }
                                                                >
                                                                    <ColumnLayout columns={4} variant="text-grid">
                                                                      <div>
                                                                            <Box variant="awsui-key-label">Cluster name</Box>
                                                                            <div>{parameter_object_values['rds_id']}</div>
                                                                      </div>
                                                                      <div>
                                                                            <Box variant="awsui-key-label">CacheNodeType</Box>
                                                                            <div>{parameter_object_values['rds_size']}</div>
                                                                      </div>
                                                                      <div>
                                                                            <Box variant="awsui-key-label">ConfigurationEndpoint</Box>
                                                                            <div>{parameter_object_values['rds_host']}</div>
                                                                      </div>
                                                                      <div>
                                                                            <Box variant="awsui-key-label">Port</Box>
                                                                            <div>{parameter_object_values['rds_port']}</div>
                                                                      </div>
                                                                    </ColumnLayout>
                                                                    <br/>
                                                                    <br/>
                                                                    <ColumnLayout columns={4} variant="text-grid">
                                                                        <div>
                                                                            <Box variant="awsui-key-label">Status</Box>
                                                                            <div>{parameter_object_values['rds_status']}</div>
                                                                        </div>
                                                                        <div>
                                                                            <Box variant="awsui-key-label">ClusterEnabled</Box>
                                                                            <div>{parameter_object_values['rds_mode']}</div>
                                                                        </div>
                                                                        <div>
                                                                            <Box variant="awsui-key-label">Shards</Box>
                                                                            <div>{parameter_object_values['rds_shards']}</div>
                                                                        </div>
                                                                        <div>
                                                                            <Box variant="awsui-key-label">Nodes</Box>
                                                                            <div>{parameter_object_values['rds_nodes']}</div>
                                                                        </div>
                                                                    </ColumnLayout>
                                                                    <br/>
                                                                    <br/>
                                                                    <ColumnLayout columns={4} variant="text-grid">
                                                                        <div>
                                                                            <Box variant="awsui-key-label">MultiAZ</Box>
                                                                            <div>{parameter_object_values['rds_multiaz']}</div>
                                                                        </div>
                                                                        <div>
                                                                            <Box variant="awsui-key-label">AutheticationMode</Box>
                                                                            <div>{parameter_object_values['rds_auth']}</div>
                                                                        </div>
                                                                    </ColumnLayout>
                                                                    <br/>
                                                                    <br/>
                                                                  </Container>
                                                
                                                        </td>
                                                    </tr>
                                                </table> 
                                                
                                          </>
                                          
                                      },
                                      ]}
                        />

        </>
        }
        
         />
         
    </div>
  );
}

export default App;
