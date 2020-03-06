const xpaths = {
    labSectionTable:
      '//*[@id="SSR_CLS_TBL_R2$scroll$0"]/tbody/tr[2]/td/table/tbody', // inner table structure
    discussionSectionTable:
      '//*[@id="SSR_CLS_TBL_R1$scroll$0"]/tbody/tr[2]/td/table/tbody',
    shoppingCartTable: '//*[@id="SSR_REGFORM_VW$scroll$0"]/tbody',
    enrollmentStatusTable:
      '//*[@id="SSR_SS_ERD_ER$scroll$0"]/tbody/tr/td/table/tbody',
    courseImageStatus: '//*[@id="win0divSSR_CLS_DTL_WRK_SSR_STATUS_LONG"]/div/img'
  };
  
  const tabs = {
    classSearch: "Class Search",
    shoppingCart: "Enrollment Shopping Cart"
  };

module.exports = {
    xpaths,
    tabs
};