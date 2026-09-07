# Stored Procedure Parameter Mapping

This document maps all database stored procedures with their required parameters.

## ACCESSKEY_PROCEDURES.sql

### `CMSADDACCKEY`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCUSTOMERID` | `INT` |
| `IN` | `PKEYTYPE` | `VARCHAR(30)` |
| `IN` | `PKEYVALUE` | `VARCHAR(255)` |
| `IN` | `PEXPIRESAT` | `DATETIME` |
| `IN` | `PCREATEDBY` | `INT` |

### `CMSUPDACCKEY`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PACCKEYID` | `INT` |
| `IN` | `PKEYVALUE` | `VARCHAR(255)` |
| `IN` | `PEXPIRESAT` | `DATETIME` |

### `CMSGETACCKEY`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PACCKEYID` | `INT` |

### `CMSLISTACCKEY`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCUSTOMERID` | `INT` |

### `CMSACTACCKEY`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PACCKEYID` | `INT` |

### `CMSDEACTACCKEY`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PACCKEYID` | `INT` |

### `CMSVALIDATEACCKEY`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PKEYVALUE` | `VARCHAR(255)` |

## BOOKING_PROCEDURES.sql

### `CMSADDBOOK`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PBOOKTYPECODE` | `VARCHAR(10)` |
| `IN` | `PCUSTOMERID` | `INT` |
| `IN` | `PSERVICEID` | `INT` |
| `IN` | `PSERVICEDATE` | `DATE` |
| `IN` | `PITEMSJSON` | `JSON` |
| `IN` | `PBOOKEDBY` | `INT` |
| `IN` | `PREMARKS` | `VARCHAR(255)` |

### `CMSUPDBOOKITEM`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PBOOKID` | `INT` |
| `IN` | `PITEMSJSON` | `JSON` |
| `IN` | `PCHANGEDBY` | `INT` |

### `CMSCANCELBOOK`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PBOOKID` | `INT` |
| `IN` | `PCANCELLEDBY` | `INT` |
| `IN` | `PISSTAFFOVERRIDE` | `TINYINT` |
| `IN` | `PCHGREASON` | `VARCHAR(255)` |

### `CMSSERVEBOOK`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PBOOKID` | `INT` |
| `IN` | `PSERVEDBY` | `INT` |

### `CMSNOSHOWBOOK`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PSERVICEDATE` | `DATE` |
| `IN` | `PSERVICEID` | `INT` |
| `IN` | `PCHANGEDBY` | `INT` |

### `CMSNOSHOWSINGLEBOOK`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PBOOKID` | `INT` |
| `IN` | `PCHANGEDBY` | `INT` |
| `IN` | `PCHGREASON` | `VARCHAR(255)` |

### `CMSTOGGLEKIOSK`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PDAYMENUID` | `INT` |
| `IN` | `PISKIOSK` | `TINYINT` |
| `IN` | `PCHANGEDBY` | `INT` |

### `CMSGETBOOK`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PBOOKID` | `INT` |

### `CMSLISTBOOK`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCUSTOMERID` | `INT` |
| `IN` | `PSERVICEID` | `INT` |
| `IN` | `PSTARTDATE` | `DATE` |
| `IN` | `PENDDATE` | `DATE` |
| `IN` | `PSTATUSCODE` | `VARCHAR(10)` |

### `CMSLISTKITCHENPREP`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PDAYSLOTID` | `INT` |

### `CMSLISTBOOKTODAY`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCUSTOMERID` | `INT` |
| `IN` | `PSERVICEID` | `INT` |
| `IN` | `PSTATUSCODE` | `VARCHAR(10)` |

## CANTEENROLE_PROCEDURES.sql

### `CMSASSIGNCANROL`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PUSERID` | `INT` |
| `IN` | `PROLEID` | `INT` |
| `IN` | `PCANTEENID` | `INT` |
| `IN` | `PISDEFAULT` | `TINYINT` |
| `IN` | `PVALIDFROM` | `DATETIME` |
| `IN` | `PVALIDUNTIL` | `DATETIME` |
| `IN` | `PASSIGNEDBY` | `INT` |

### `CMSREMOVECANROL`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PUSERID` | `INT` |
| `IN` | `PROLEID` | `INT` |
| `IN` | `PCANTEENID` | `INT` |

### `CMSLISTCANROL`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PUSERID` | `INT` |

### `CMSLISTCANROLSTAFF`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCANTEENID` | `INT` |

## CANTEEN_PROCEDURES.sql

### `CMSADDCANTEEN`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCENTERID` | `INT` |
| `IN` | `PCANTEENCODE` | `VARCHAR(20)` |
| `IN` | `PCANTEENNAME` | `VARCHAR(120)` |
| `IN` | `PLOCATION` | `VARCHAR(150)` |
| `IN` | `PCREATEDBY` | `INT` |

### `CMSUPDCANTEEN`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCANTEENID` | `INT` |
| `IN` | `PCANTEENNAME` | `VARCHAR(120)` |
| `IN` | `PLOCATION` | `VARCHAR(150)` |
| `IN` | `PSTATUSCODE` | `VARCHAR(20)` |

### `CMSACTCANTEEN`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCANTEENID` | `INT` |

### `CMSDEACTCANTEEN`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCANTEENID` | `INT` |

### `CMSGETCANTEEN`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCANTEENID` | `INT` |

### `CMSLISTCANTEEN`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCENTERID` | `INT` |

### `CMSSEARCHCANTEEN`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PKEYWORD` | `VARCHAR(120)` |

## CENTER_PROCEDURES.sql

### `CMSADDCENTER`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCENTERCODE` | `VARCHAR(20)` |
| `IN` | `PCENTERNAME` | `VARCHAR(120)` |
| `IN` | `PLOCATION` | `VARCHAR(150)` |

### `CMSUPDCENTER`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCENTERID` | `INT` |
| `IN` | `PCENTERNAME` | `VARCHAR(120)` |
| `IN` | `PLOCATION` | `VARCHAR(150)` |
| `IN` | `PSTATUSCODE` | `VARCHAR(20)` |

### `CMSACTCENTER`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCENTERID` | `INT` |

### `CMSDEACTCENTER`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCENTERID` | `INT` |

### `CMSGETCENTER`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCENTERID` | `INT` |

### `CMSLISTCENTER`
*No parameters required.*

### `CMSSEARCHCENTER`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PKEYWORD` | `VARCHAR(120)` |

## COMMON_PROCEDURES.sql

### `CMSGENAUTO`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `CMSGENAUTO` | `— Global Auto-Number Generator (Daily Reset)` |
| `IN` | `============================================================` | `*/` |
| `IN` | `CREATE` | `PROCEDURE CMSGENAUTO (` |
| `IN` | `PTBLNAME` | `VARCHAR(50)` |
| `IN` | `PDATAITEM` | `VARCHAR(30)` |
| `OUT` | `PNEWNO` | `VARCHAR(50)` |

### `CMSADDSTATUS`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `CMS_STATUS` | `— System-wide status lookup` |
| `IN` | `============================================================` | `*/` |
| `IN` | `CREATE` | `PROCEDURE CMSADDSTATUS (` |
| `IN` | `PSTATUSID` | `INT, -- Must be provided manually` |
| `IN` | `PSTATUSCODE` | `VARCHAR(10)` |
| `IN` | `PSTATUSNAME` | `VARCHAR(50)` |
| `IN` | `PSTATUSGRP` | `VARCHAR(30)` |
| `IN` | `PDESCR` | `VARCHAR(255)` |

### `CMSUPDSTATUS`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PSTATUSID` | `INT` |
| `IN` | `PSTATUSNAME` | `VARCHAR(50)` |
| `IN` | `PSTATUSGRP` | `VARCHAR(30)` |
| `IN` | `PDESCR` | `VARCHAR(255)` |

### `CMSGETSTATUS`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PSTATUSID` | `INT` |

### `CMSLISTSTATUS`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PSTATUSGRP` | `VARCHAR(30)` |

### `CMSACTSTATUS`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PSTATUSID` | `INT` |

### `CMSDEACTSTATUS`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PSTATUSID` | `INT` |

### `CMSADDCUSTTYPE`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCTYPECODE` | `VARCHAR(20)` |
| `IN` | `PCTYPENAME` | `VARCHAR(80)` |
| `IN` | `PDESCR` | `VARCHAR(255)` |

### `CMSUPDCUSTTYPE`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCTYPEID` | `INT` |
| `IN` | `PCTYPENAME` | `VARCHAR(80)` |
| `IN` | `PDESCR` | `VARCHAR(255)` |

### `CMSGETCUSTTYPE`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCTYPEID` | `INT` |

### `CMSLISTCUSTTYPE`
*No parameters required.*

### `CMSACTCUSTTYPE`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCTYPEID` | `INT` |

### `CMSDEACTCUSTTYPE`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCTYPEID` | `INT` |

### `CMSADDSCREEN`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PSCREENCODE` | `VARCHAR(50)` |
| `IN` | `PSCREENNAME` | `VARCHAR(100)` |
| `IN` | `PDESCR` | `VARCHAR(255)` |
| `IN` | `PROUTEPATH` | `VARCHAR(150)` |
| `IN` | `PCREATEDBY` | `INT` |

### `CMSUPDSCREEN`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PSCREENID` | `INT` |
| `IN` | `PSCREENNAME` | `VARCHAR(100)` |
| `IN` | `PDESCR` | `VARCHAR(255)` |
| `IN` | `PROUTEPATH` | `VARCHAR(150)` |

### `CMSGETSCREEN`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PSCREENID` | `INT` |

### `CMSLISTSCREEN`
*No parameters required.*

### `CMSACTSCREEN`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PSCREENID` | `INT` |

### `CMSDEACTSCREEN`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PSCREENID` | `INT` |

### `CMSSETROLESCN`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PROLEID` | `INT` |
| `IN` | `PSCREENID` | `INT` |
| `IN` | `PCANVIEW` | `TINYINT` |
| `IN` | `PCANCREATE` | `TINYINT` |
| `IN` | `PCANUPDATE` | `TINYINT` |
| `IN` | `PCANDELETE` | `TINYINT` |

### `CMSGETROLESCN`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PROLEID` | `INT` |
| `IN` | `PSCREENID` | `INT` |

### `CMSLISTROLESCN`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PROLEID` | `INT` |

### `CMSREMOVEROLESCN`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PROLEID` | `INT` |
| `IN` | `PSCREENID` | `INT` |

### `CMSADDAUTONO`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PTBLNAME` | `VARCHAR(50)` |
| `IN` | `PDATAITEM` | `VARCHAR(30)` |
| `IN` | `PITEMLEN` | `INT` |
| `IN` | `PFLDTYPE` | `VARCHAR(10)` |
| `IN` | `PPREFIXCHAR` | `VARCHAR(5)` |
| `IN` | `PSTARTNO` | `BIGINT` |
| `IN` | `PCREATEDBY` | `INT` |

### `CMSUPDAUTONO`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PAUTONOID` | `INT` |
| `IN` | `PITEMLEN` | `INT` |
| `IN` | `PPREFIXCHAR` | `VARCHAR(5)` |
| `IN` | `PSTATUS` | `VARCHAR(10)` |

### `CMSLISTAUTONO`
*No parameters required.*

## CONSUMERROLE_PROCEDURES.sql

### `CMSASSIGNCONSROL`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PUSERID` | `INT` |
| `IN` | `PROLEID` | `INT` |
| `IN` | `PASSIGNEDBY` | `INT` |
| `IN` | `PVALIDFROM` | `DATETIME` |
| `IN` | `PVALIDUNTIL` | `DATETIME` |

### `CMSREMOVECONSROL`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PUSERID` | `INT` |
| `IN` | `PROLEID` | `INT` |

### `CMSLISTCONSROL`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PUSERID` | `INT` |

## CUSTOMER_PROCEDURES.sql

### `CMSADDCUST`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PUSERID` | `INT` |
| `IN` | `PCTYPECODE` | `VARCHAR(20)` |
| `IN` | `PDISPNAME` | `VARCHAR(120)` |
| `IN` | `PSTATUSCODE` | `VARCHAR(20)` |
| `IN` | `PVALIDFROM` | `DATETIME` |
| `IN` | `PVALIDUNTIL` | `DATETIME` |

### `CMSUPDCUST`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCUSTOMERID` | `INT` |
| `IN` | `PDISPNAME` | `VARCHAR(120)` |
| `IN` | `PSTATUSCODE` | `VARCHAR(20)` |
| `IN` | `PVALIDFROM` | `DATETIME` |
| `IN` | `PVALIDUNTIL` | `DATETIME` |

### `CMSGETCUST`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCUSTOMERID` | `INT` |

### `CMSLISTCUST`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCTYPECODE` | `VARCHAR(20)` |
| `IN` | `PSTATUSCODE` | `VARCHAR(20)` |

### `CMSSEARCHCUST`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PKEYWORD` | `VARCHAR(120)` |

### `CMSACTCUST`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCUSTOMERID` | `INT` |

### `CMSDEACTCUST`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCUSTOMERID` | `INT` |

### `CMSGETCUSTBYUSER`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PUSERID` | `INT` |

## DAYMENU_PROCEDURES.sql

### `CMSREPLACEDMENUITEMS`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `USE` | `cms_db;` |
| `IN` | `DROP` | `PROCEDURE IF EXISTS CMSVIEWMENU;` |
| `IN` | `DROP` | `PROCEDURE IF EXISTS CMSREPLACEDMENUITEMS;` |
| `IN` | `DROP` | `PROCEDURE IF EXISTS CMSSUBMITDMENU;` |
| `IN` | `DROP` | `PROCEDURE IF EXISTS CMSAPPROVEDMENU;` |
| `IN` | `DROP` | `PROCEDURE IF EXISTS CMSREJECTDMENU;` |
| `IN` | `DROP` | `PROCEDURE IF EXISTS CMSGETDMENUWORKSPACE;` |
| `IN` | `DROP` | `PROCEDURE IF EXISTS CMSLISTPENDINGDMENUS;` |
| `IN` | `DROP` | `PROCEDURE IF EXISTS CMSGETDAYMENUBYID;` |
| `IN` | `DELIMITER` | `$$` |
| `IN` | `CMS_DAYMENU` | `— Batch Day Menu Procedures` |
| `IN` | `============================================================` | `*/` |
| `IN` | `CREATE` | `PROCEDURE CMSREPLACEDMENUITEMS (` |
| `IN` | `PDAYSLOTID` | `INT` |
| `IN` | `PITEMSJSON` | `JSON` |
| `IN` | `PUSERID` | `INT` |
| `IN` | `PREMARKS` | `VARCHAR(255)` |

### `CMSSUBMITDMENU`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PDAYSLOTID` | `INT` |
| `IN` | `PUSERID` | `INT` |
| `IN` | `PREMARKS` | `VARCHAR(255)` |

### `CMSAPPROVEDMENU`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PDAYSLOTID` | `INT` |
| `IN` | `PUSERID` | `INT` |
| `IN` | `PREMARKS` | `VARCHAR(255)` |

### `CMSREJECTDMENU`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PDAYSLOTID` | `INT` |
| `IN` | `PUSERID` | `INT` |
| `IN` | `PREMARKS` | `VARCHAR(255)` |

### `CMSGETDMENUWORKSPACE`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PDAYSLOTID` | `INT` |

### `CMSLISTPENDINGDMENUS`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCANTEENID` | `INT` |

### `CMSVIEWMENU`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCANTEENID` | `INT` |
| `IN` | `PSERVDATE` | `DATE` |
| `IN` | `PCTYPECODE` | `VARCHAR(20)` |

### `CMSGETDAYMENUBYID`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PDAYMENUID` | `INT` |

## DAYSLOT_PROCEDURES.sql

### `CMSADDSLOT`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCANTEENID` | `INT` |
| `IN` | `PSERVICEID` | `INT` |
| `IN` | `PSERVDATE` | `DATE` |
| `IN` | `PSTARTTIME` | `TIME` |
| `IN` | `PENDTIME` | `TIME` |
| `IN` | `PCREATEDBY` | `INT` |

### `CMSUPDSLOT`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PDAYSLOTID` | `INT` |
| `IN` | `PSTARTTIME` | `TIME` |
| `IN` | `PENDTIME` | `TIME` |
| `IN` | `PSTATUSID` | `INT` |
| `IN` | `PCHANGEDBY` | `INT` |
| `IN` | `PCHGREASON` | `VARCHAR(255)` |

### `CMSGETSLOT`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PDAYSLOTID` | `INT` |

### `CMSLISTSLOT`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PSERVICEID` | `INT` |
| `IN` | `PCANTEENID` | `INT` |
| `IN` | `PDATEFROM` | `DATE` |
| `IN` | `PDATETO` | `DATE` |

### `CMSACTSLOT`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PDAYSLOTID` | `INT, IN PCHANGEDBY INT, IN PCHGREASON VARCHAR(255)` |

### `CMSDEACTSLOT`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PDAYSLOTID` | `INT, IN PCHANGEDBY INT, IN PCHGREASON VARCHAR(255)` |

## EMPLOYEES_VISITOR_PROCEDURES.sql

### `CMSADDPERM`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCUSTOMERID` | `INT` |
| `IN` | `PEMPCODE` | `VARCHAR(50)` |
| `IN` | `PDEPT` | `VARCHAR(100)` |
| `IN` | `PDESIG` | `VARCHAR(100)` |

### `CMSUPDPERM`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCUSTOMERID` | `INT` |
| `IN` | `PDEPT` | `VARCHAR(100)` |
| `IN` | `PDESIG` | `VARCHAR(100)` |

### `CMSGETPERM`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCUSTOMERID` | `INT` |

### `CMSADDCONT`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCUSTOMERID` | `INT` |
| `IN` | `PCONTCODE` | `VARCHAR(50)` |
| `IN` | `PVENDORNAME` | `VARCHAR(150)` |
| `IN` | `PCONTSTART` | `DATE` |
| `IN` | `PCONTEND` | `DATE` |

### `CMSUPDCONT`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCUSTOMERID` | `INT` |
| `IN` | `PVENDORNAME` | `VARCHAR(150)` |
| `IN` | `PCONTSTART` | `DATE` |
| `IN` | `PCONTEND` | `DATE` |

### `CMSGETCONT`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCUSTOMERID` | `INT` |

### `CMSADDOCE`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCUSTOMERID` | `INT` |
| `IN` | `PEMPCODE` | `VARCHAR(50)` |
| `IN` | `PCENTERNAME` | `VARCHAR(120)` |
| `IN` | `PDEPT` | `VARCHAR(100)` |
| `IN` | `PDESIG` | `VARCHAR(100)` |
| `IN` | `PVALIDFROM` | `DATETIME` |
| `IN` | `PVALIDUNTIL` | `DATETIME` |

### `CMSUPDOCE`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCUSTOMERID` | `INT` |
| `IN` | `PDEPT` | `VARCHAR(100)` |
| `IN` | `PDESIG` | `VARCHAR(100)` |
| `IN` | `PVALIDFROM` | `DATETIME` |
| `IN` | `PVALIDUNTIL` | `DATETIME` |

### `CMSGETOCE`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCUSTOMERID` | `INT` |

### `CMSADDVIS`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCUSTOMERID` | `INT` |
| `IN` | `PVISNAME` | `VARCHAR(120)` |
| `IN` | `PVISMOBILE` | `VARCHAR(20)` |
| `IN` | `PVISORG` | `VARCHAR(150)` |
| `IN` | `PVISPURPOSE` | `VARCHAR(255)` |
| `IN` | `PVISDATE` | `DATE` |
| `IN` | `PVALIDUNTIL` | `DATETIME` |
| `IN` | `PCREATEDBY` | `INT` |

### `CMSUPDVIS`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCUSTOMERID` | `INT` |
| `IN` | `PVISMOBILE` | `VARCHAR(20)` |
| `IN` | `PVISORG` | `VARCHAR(150)` |
| `IN` | `PVISPURPOSE` | `VARCHAR(255)` |
| `IN` | `PVALIDUNTIL` | `DATETIME` |
| `IN` | `PSTATUSCODE` | `VARCHAR(20)` |

### `CMSGETVIS`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCUSTOMERID` | `INT` |

### `CMSREGPERM`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PLOGINID` | `VARCHAR(50)` |
| `IN` | `PFULLNAME` | `VARCHAR(120)` |
| `IN` | `PEMAIL` | `VARCHAR(120)` |
| `IN` | `PMOBILENO` | `VARCHAR(20)` |
| `IN` | `PPWDHASH` | `VARCHAR(255)` |
| `IN` | `PEMPCODE` | `VARCHAR(50)` |
| `IN` | `PDEPT` | `VARCHAR(100)` |
| `IN` | `PDESIG` | `VARCHAR(100)` |
| `IN` | `PKEYTYPE` | `VARCHAR(30)` |
| `IN` | `PKEYVALUE` | `VARCHAR(255)` |
| `IN` | `PCREATEDBY` | `INT` |

### `CMSREGCONT`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PLOGINID` | `VARCHAR(50)` |
| `IN` | `PFULLNAME` | `VARCHAR(120)` |
| `IN` | `PEMAIL` | `VARCHAR(120)` |
| `IN` | `PMOBILENO` | `VARCHAR(20)` |
| `IN` | `PPWDHASH` | `VARCHAR(255)` |
| `IN` | `PCONTCODE` | `VARCHAR(50)` |
| `IN` | `PVENDORNAME` | `VARCHAR(150)` |
| `IN` | `PCONTSTART` | `DATE` |
| `IN` | `PCONTEND` | `DATE` |
| `IN` | `PDISPNAME` | `VARCHAR(120)` |
| `IN` | `PKEYTYPE` | `VARCHAR(30)` |
| `IN` | `PKEYVALUE` | `VARCHAR(255)` |
| `IN` | `PEXPIRESAT` | `DATETIME` |
| `IN` | `PCREATEDBY` | `INT` |

### `CMSREGOCE`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PLOGINID` | `VARCHAR(50)` |
| `IN` | `PFULLNAME` | `VARCHAR(120)` |
| `IN` | `PEMAIL` | `VARCHAR(120)` |
| `IN` | `PMOBILENO` | `VARCHAR(20)` |
| `IN` | `PPWDHASH` | `VARCHAR(255)` |
| `IN` | `PEMPCODE` | `VARCHAR(50)` |
| `IN` | `PCENTERNAME` | `VARCHAR(120)` |
| `IN` | `PDEPT` | `VARCHAR(100)` |
| `IN` | `PDESIG` | `VARCHAR(100)` |
| `IN` | `PVALIDFROM` | `DATETIME` |
| `IN` | `PVALIDUNTIL` | `DATETIME` |
| `IN` | `PDISPNAME` | `VARCHAR(120)` |
| `IN` | `PKEYTYPE` | `VARCHAR(30)` |
| `IN` | `PKEYVALUE` | `VARCHAR(255)` |
| `IN` | `PEXPIRESAT` | `DATETIME` |
| `IN` | `PCREATEDBY` | `INT` |

### `CMSREGVIS`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PVISNAME` | `VARCHAR(120)` |
| `IN` | `PVISMOBILE` | `VARCHAR(20)` |
| `IN` | `PVISORG` | `VARCHAR(150)` |
| `IN` | `PVISPURPOSE` | `VARCHAR(255)` |
| `IN` | `PVISDATE` | `DATE` |
| `IN` | `PVALIDUNTIL` | `DATETIME` |
| `IN` | `PKEYTYPE` | `VARCHAR(30)` |
| `IN` | `PKEYVALUE` | `VARCHAR(255)` |
| `IN` | `PCREATEDBY` | `INT` |

## HOLIDAY_PROCEDURES.sql

### `CMSADDHOLIDAY`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PHOLIDAYDATE` | `DATE` |
| `IN` | `PHOLIDAYNAME` | `VARCHAR(100)` |
| `IN` | `PHOLIDAYTYPE` | `VARCHAR(20)` |
| `IN` | `PISRECURRING` | `TINYINT(1)` |
| `IN` | `PCREATEDBY` | `INT` |

### `CMSUPDHOLIDAY`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PHOLIDAYID` | `INT` |
| `IN` | `PHOLIDAYDATE` | `DATE` |
| `IN` | `PHOLIDAYNAME` | `VARCHAR(100)` |
| `IN` | `PHOLIDAYTYPE` | `VARCHAR(20)` |
| `IN` | `PISRECURRING` | `TINYINT(1)` |
| `IN` | `PSTATUSCODE` | `VARCHAR(20)` |

### `CMSGETHOLIDAY`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PHOLIDAYID` | `INT` |

### `CMSLISTHOLIDAY`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PYEAR` | `INT` |

### `CMSDEACTHOLIDAY`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PHOLIDAYID` | `INT` |

## MENUITEM_PRICE_PROCEDURES.sql

### `CMSADDMENUITEM`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `USE` | `cms_db;` |
| `IN` | `DROP` | `PROCEDURE IF EXISTS CMSADDMENUITEM;` |
| `IN` | `DROP` | `PROCEDURE IF EXISTS CMSUPDMENUITEM;` |
| `IN` | `DROP` | `PROCEDURE IF EXISTS CMSGETMENUITEM;` |
| `IN` | `DROP` | `PROCEDURE IF EXISTS CMSLISTMENUITEM;` |
| `IN` | `DROP` | `PROCEDURE IF EXISTS CMSSEARCHMENUITEM;` |
| `IN` | `DROP` | `PROCEDURE IF EXISTS CMSACTMENUITEM;` |
| `IN` | `DROP` | `PROCEDURE IF EXISTS CMSDEACTMENUITEM;` |
| `IN` | `DROP` | `PROCEDURE IF EXISTS CMSADDITEMPRICE;` |
| `IN` | `DROP` | `PROCEDURE IF EXISTS CMSGETITEMPRICE;` |
| `IN` | `DROP` | `PROCEDURE IF EXISTS CMSGETITEMPRICEDT;` |
| `IN` | `DROP` | `PROCEDURE IF EXISTS CMSLISTITEMPRICE;` |
| `IN` | `DROP` | `PROCEDURE IF EXISTS CMSDEACTITEMPRICE;` |
| `IN` | `DROP` | `PROCEDURE IF EXISTS CMSCHECKITEMPRICEREADINESS;` |
| `IN` | `DELIMITER` | `$$` |
| `IN` | `CMS_MENUITEM` | `— Shared Menu Item Catalog (NO price columns)` |
| `IN` | `============================================================` | `*/` |
| `IN` | `CREATE` | `PROCEDURE CMSADDMENUITEM (` |
| `IN` | `PSHORTNAME` | `VARCHAR(30)` |
| `IN` | `PITEMNAME` | `VARCHAR(100)` |
| `IN` | `PITEMDESCR` | `VARCHAR(255)` |
| `IN` | `PISSPECIAL` | `TINYINT` |
| `IN` | `PCREATEDBY` | `INT` |

### `CMSUPDMENUITEM`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PMENUITEMID` | `INT` |
| `IN` | `PSHORTNAME` | `VARCHAR(30)` |
| `IN` | `PITEMNAME` | `VARCHAR(100)` |
| `IN` | `PITEMDESCR` | `VARCHAR(255)` |
| `IN` | `PISSPECIAL` | `TINYINT` |
| `IN` | `PSTATUSID` | `INT` |
| `IN` | `PCHANGEDBY` | `INT` |
| `IN` | `PCHGREASON` | `VARCHAR(255)` |

### `CMSGETMENUITEM`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PMENUITEMID` | `INT` |

### `CMSLISTMENUITEM`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PISSPECIAL` | `TINYINT` |
| `IN` | `PSTATUSID` | `INT` |

### `CMSSEARCHMENUITEM`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PKEYWORD` | `VARCHAR(100)` |

### `CMSACTMENUITEM`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PMENUITEMID` | `INT, IN PCHANGEDBY INT, IN PCHGREASON VARCHAR(255)` |

### `CMSDEACTMENUITEM`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PMENUITEMID` | `INT, IN PCHANGEDBY INT, IN PCHGREASON VARCHAR(255)` |

### `CMSCHECKITEMPRICEREADINESS`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PMENUITEMID` | `INT` |
| `IN` | `PSERVICEDATE` | `DATE` |

### `CMSADDITEMPRICE`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PMENUITEMID` | `INT` |
| `IN` | `PEFFFROM` | `DATE` |
| `IN` | `PPRICEJSON` | `JSON` |
| `IN` | `PCREATEDBY` | `INT` |

### `CMSGETITEMPRICE`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PMENUITEMID` | `INT` |
| `IN` | `PSERVICEDATE` | `DATE` |

### `CMSGETITEMPRICEDT`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PMENUITEMID` | `INT` |
| `IN` | `PCTYPECODE` | `VARCHAR(20)` |
| `IN` | `PSERVICEDATE` | `DATE` |

### `CMSLISTITEMPRICE`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PMENUITEMID` | `INT` |

### `CMSDEACTITEMPRICE`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PITEMPRICEID` | `INT` |

## MENUTEMPLATE_PROCEDURES.sql

### `CMSADDMENUTPL`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCANTEENID` | `INT` |
| `IN` | `PSERVICEID` | `INT` |
| `IN` | `PTPLNAME` | `VARCHAR(80)` |
| `IN` | `PWEEKDAY` | `TINYINT` |
| `IN` | `PCREATEDBY` | `INT` |

### `CMSUPDMENUTPL`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PMENUTPLID` | `INT` |
| `IN` | `PTPLNAME` | `VARCHAR(80)` |
| `IN` | `PWEEKDAY` | `TINYINT` |
| `IN` | `PSTATUSCODE` | `VARCHAR(20)` |

### `CMSGETMENUTPL`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PMENUTPLID` | `INT` |

### `CMSLISTMENUTPL`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCANTEENID` | `INT, IN PSERVICEID INT` |

### `CMSDEACTMENUTPL`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PMENUTPLID` | `INT` |

### `CMSADDMENUTPLDT`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PMENUTPLID` | `INT` |
| `IN` | `PMENUITEMID` | `INT` |
| `IN` | `PISSPECIAL` | `TINYINT` |
| `IN` | `PISPREBOOK` | `TINYINT` |
| `IN` | `PISKIOSK` | `TINYINT` |
| `IN` | `PMAXQTY` | `INT` |
| `IN` | `PDEFAVAILQTY` | `INT` |

### `CMSREMOVEMENUTPLDT`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PMENUTPLDTID` | `INT` |

### `CMSLISTMENUTPLDT`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PMENUTPLID` | `INT` |

### `CMSAPPLYMENUTPL`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PMENUTPLID` | `INT` |
| `IN` | `PTARGETDATE` | `DATE` |
| `IN` | `PCREATEDBY` | `INT` |
| `OUT` | `POUTDAYSLOTID` | `INT` |
| `OUT` | `POUTITEMSINSERTED` | `INT` |

### `CMSBULKGENERATEMENU`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCANTEENID` | `INT` |
| `IN` | `PSERVICEID` | `INT` |
| `IN` | `PSTARTDATE` | `DATE` |
| `IN` | `PENDDATE` | `DATE` |
| `IN` | `PCREATEDBY` | `INT` |

## REPORTING_SERVING_PROCEDURES.sql

### `CMSGETBOOKFORSERVING`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PLOGINID` | `VARCHAR(50)` |
| `IN` | `PBOOKNO` | `VARCHAR(30)` |

### `CMSGETMONTHLYEXP`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCUSTOMERID` | `INT` |
| `IN` | `PYEAR` | `INT` |
| `IN` | `PMONTH` | `INT` |

### `CMSLISTBOOKHISTORY`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCUSTOMERID` | `INT` |
| `IN` | `PSTARTDATE` | `DATE` |
| `IN` | `PENDDATE` | `DATE` |
| `IN` | `PSTATUSCODE` | `VARCHAR(10)` |
| `IN` | `PPAGE` | `INT` |
| `IN` | `PPAGESIZE` | `INT` |

### `CMSBULKBOOK`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCUSTOMERID` | `INT` |
| `IN` | `PSERVICEID` | `INT` |
| `IN` | `PSTARTDATE` | `DATE` |
| `IN` | `PDAYCOUNT` | `INT` |
| `IN` | `PITEMSJSON` | `JSON` |
| `IN` | `PBOOKEDBY` | `INT` |

### `CMSGETKITCHENSUMMARY`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PDAYSLOTID` | `INT` |

### `CMSSERVEBOOKING`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PBOOKID` | `INT` |
| `IN` | `PUSERID` | `INT` |

### `CMSPROCESSNOSHOWS`
*No parameters required.*

## ROLE_PROCEDURES.sql

### `CMSADDROLE`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PROLECODE` | `VARCHAR(50)` |
| `IN` | `PROLENAME` | `VARCHAR(100)` |
| `IN` | `PDESCR` | `VARCHAR(255)` |

### `CMSUPDROL`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PROLEID` | `INT` |
| `IN` | `PROLENAME` | `VARCHAR(100)` |
| `IN` | `PDESCR` | `VARCHAR(255)` |

### `CMSACTROL`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PROLEID` | `INT` |

### `CMSDEACTROL`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PROLEID` | `INT` |

### `CMSGETROL`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PROLEID` | `INT` |

### `CMSLISTROL`
*No parameters required.*

## SERVICE_PROCEDURES.sql

### `CMSADDSERV`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PSERVCODE` | `VARCHAR(20)` |
| `IN` | `PSERVNAME` | `VARCHAR(80)` |
| `IN` | `PDEFSTART` | `TIME` |
| `IN` | `PDEFEND` | `TIME` |
| `IN` | `PCREATEDBY` | `INT` |

### `CMSUPDSERV`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PSERVICEID` | `INT` |
| `IN` | `PSERVNAME` | `VARCHAR(80)` |
| `IN` | `PDEFSTART` | `TIME` |
| `IN` | `PDEFEND` | `TIME` |
| `IN` | `PSTATUSCODE` | `VARCHAR(20)` |
| `IN` | `PCHANGEDBY` | `INT` |
| `IN` | `PCHGREASON` | `VARCHAR(255)` |

### `CMSGETSERV`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PSERVICEID` | `INT` |

### `CMSLISTSERV`
*No parameters required.*

### `CMSACTSERV`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PSERVICEID` | `INT, IN PCHANGEDBY INT, IN PCHGREASON VARCHAR(255)` |

### `CMSDEACTSERV`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PSERVICEID` | `INT, IN PCHANGEDBY INT, IN PCHGREASON VARCHAR(255)` |

### `CMSSEARCHSERV`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PKEYWORD` | `VARCHAR(80)` |

## USER_PROCEDURES.sql

### `CMSADDUSER`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PLOGINID` | `VARCHAR(50)` |
| `IN` | `PFULLNAME` | `VARCHAR(120)` |
| `IN` | `PEMAIL` | `VARCHAR(120)` |
| `IN` | `PMOBILENO` | `VARCHAR(20)` |
| `IN` | `PPWDHASH` | `VARCHAR(255)` |
| `IN` | `PAUTHPROV` | `VARCHAR(20)` |
| `IN` | `PAUTHID` | `VARCHAR(120)` |

### `CMSUPDUSER`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PUSERID` | `INT` |
| `IN` | `PFULLNAME` | `VARCHAR(120)` |
| `IN` | `PEMAIL` | `VARCHAR(120)` |
| `IN` | `PMOBILENO` | `VARCHAR(20)` |
| `IN` | `PAUTHPROV` | `VARCHAR(20)` |
| `IN` | `PAUTHID` | `VARCHAR(120)` |

### `CMSGETUSER`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PUSERID` | `INT` |

### `CMSLISTUSER`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PISACTIVE` | `TINYINT` |

### `CMSSEARCHUSER`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PKEYWORD` | `VARCHAR(120)` |

### `CMSCHANGEPWD`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PUSERID` | `INT` |
| `IN` | `PNEWPWDHASH` | `VARCHAR(255)` |

### `CMSACTUSER`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PUSERID` | `INT` |

### `CMSDEACTUSER`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PUSERID` | `INT` |

### `CMSLOGININFO`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PLOGINID` | `VARCHAR(50)` |

## WALLET_PROCEDURES.sql

### `CMSADDWALLET`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCUSTOMERID` | `INT` |
| `IN` | `POPENAMOUNT` | `DECIMAL(12,2)` |
| `IN` | `PCREATEDBY` | `INT` |
| `IN` | `PREMARKS` | `VARCHAR(500)` |

### `CMSADDWALLETAMT`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCUSTOMERID` | `INT` |
| `IN` | `PAMOUNT` | `DECIMAL(12,2)` |
| `IN` | `PPAYMENTMETHOD` | `VARCHAR(20)` |
| `IN` | `PREFNO` | `VARCHAR(80)` |
| `IN` | `PCREATEDBY` | `INT` |
| `IN` | `PREMARKS` | `VARCHAR(500)` |

### `CMSGETWALLET`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCUSTOMERID` | `INT` |

### `CMSLISTWALLETTRAN`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCUSTOMERID` | `INT` |
| `IN` | `PFROMDATE` | `DATE` |
| `IN` | `PTODATE` | `DATE` |

### `CMSREQWALLETWD`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCUSTOMERID` | `INT` |
| `IN` | `PAMOUNT` | `DECIMAL(12,2)` |
| `IN` | `PREQUESTEDBY` | `INT` |
| `IN` | `PREMARKS` | `VARCHAR(500)` |

### `CMSAPPWALLETWD`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PWALLETWDID` | `INT` |
| `IN` | `PPROCESSEDBY` | `INT` |
| `IN` | `PPAYMENTMETHOD` | `VARCHAR(20)` |
| `IN` | `PREFNO` | `VARCHAR(80)` |
| `IN` | `PREMARKS` | `VARCHAR(500)` |

### `CMSREJWALLETWD`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PWALLETWDID` | `INT` |
| `IN` | `PPROCESSEDBY` | `INT` |
| `IN` | `PREMARKS` | `VARCHAR(500)` |

### `CMSLISTWALLETWD`
| Direction | Parameter Name | Data Type |
|-----------|----------------|-----------|
| `IN` | `PCUSTOMERID` | `INT` |
| `IN` | `PSTATUSCODE` | `VARCHAR(20)` |


