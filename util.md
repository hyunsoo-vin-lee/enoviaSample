## slSelect 만들기
```
import com.dassault_systemes.enovia.lsa.Helper;

StringList selectBus = Helper.stringList(DomainConstants.SELECT_ID, DomainConstants.SELECT_CURRENT, PRODUCT_NAME, ATTRIBUTE_ENTRY_TYPE,
					ATTRIBUTE_LOT_NUMBER, ATTRIBUTE_TOTAL_QTY, ATTRIBUTE_TOTAL_QTY_UOM, ATTRIBUTE_DEFECTIVE_QTY, ATTRIBUTE_DEFECTIVE_QTY_UOM);
```
