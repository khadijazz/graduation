exports.ApiFeature = class ApiFeature {
constructor(dbQuery,requestQuery){
    this.dbQuery=dbQuery;
    this.requestQuery=requestQuery;
}
paginate(pageNumber=1, pageSize=5){
                                          //btrga3 awl truthy value                      
pageNumber=Number(this.requestQuery.pageNumber)|| pageNumber;
pageSize=Number(this.requestQuery.pageSize)|| pageSize;
let skip=0;
if(pageNumber !==1 )skip=(pageNumber-1)*pageSize;
this.dbQuery.skip(skip).limit(pageSize).sort({_id:-1});
return this;
}
sort(){
if(this.requestQuery.sort){
const sortBy=this.requestQuery.sort.split(',').join(' ');
this.dbQuery.sort(sortBy);
}
return this;
}

projection(){
    if(this.requestQuery.project){
     const projecitonStr=this.requestQuery.project.split(',').join(' ');
        this.dbQuery.select(projecitonStr);
    }
    return this;
}

}