function number(value,min=0,max=1e15){
 if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)throw Error(`กรอกตัวเลขระหว่าง ${min} ถึง ${max}`);
 return value;
}
export function units({amount,power}){
 number(amount,0,1e6); if(![10,20,30,40,50].includes(power))throw Error('เลือกกำลัง 10, 20, 30, 40 หรือ 50');
 const bytes=amount*2**power;return {bytes,bits:bytes*8,mb:bytes/1e6,mib:bytes/2**20};
}

export function latency({first,second,count}){number(first,0.001);number(second,0.001);number(count,1,1e6);return {ratio:second/first,totalMs:second*count/1e6,firstMs:first/1e6,secondMs:second/1e6};}

export function availability({percent,days}){number(percent,0,100);number(days,1,3660);const seconds=(100-percent)/100*days*86400;return {seconds,minutes:seconds/60,hours:seconds/3600};}

export function traffic({mau,daily,posts,peak}){number(mau,0,1e10);number(daily,0,100);number(posts,0,10000);number(peak,1,100);const dau=mau*daily/100,perDay=dau*posts,qps=perDay/86400;return {dau,perDay,qps,peak:qps*peak};}

export function storage({posts,media,mb,years,copies,overhead}){number(posts,0,1e14);number(media,0,100);number(mb,0,1e6);number(years,0,100);number(copies,1,20);if(!Number.isInteger(copies))throw Error('จำนวนสำเนาต้องเป็นจำนวนเต็ม');number(overhead,0,1000);const dailyTB=posts*media/100*mb/1e6,logicalPB=dailyTB*365*years/1000;return {dailyTB,logicalPB,physicalPB:logicalPB*copies*(1+overhead/100)};}

export function rounding({numerator,denominator,roughN,roughD}){number(numerator,0.001);number(denominator,0.001);number(roughN,0.001);number(roughD,0.001);const exact=numerator/denominator,estimate=roughN/roughD;return {exact,estimate,errorPercent:(estimate-exact)/exact*100};}
