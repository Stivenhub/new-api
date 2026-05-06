package model

import (
	"github.com/QuantumNous/new-api/common"

	"gorm.io/gorm"
)

type Department struct {
	Id             int            `json:"id"`
	OrganizationId int            `json:"organization_id" gorm:"not null;index;uniqueIndex:uk_dept_org_code,priority:1"`
	ParentId       int            `json:"parent_id" gorm:"default:0"`
	Name           string         `json:"name" gorm:"size:128;not null"`
	Code           string         `json:"code" gorm:"size:64;not null;uniqueIndex:uk_dept_org_code,priority:2"`
	Description    string         `json:"description,omitempty" gorm:"type:text"`
	Sort           int            `json:"sort" gorm:"default:0"`
	Status         int            `json:"status" gorm:"default:1"`
	CreatedTime    int64          `json:"created_time" gorm:"bigint"`
	UpdatedTime    int64          `json:"updated_time" gorm:"bigint"`
	DeletedAt      gorm.DeletedAt `json:"-" gorm:"index;uniqueIndex:uk_dept_org_code,priority:3"`
}

func (d *Department) Insert() error {
	now := common.GetTimestamp()
	d.CreatedTime = now
	d.UpdatedTime = now
	return DB.Create(d).Error
}

func (d *Department) Update() error {
	d.UpdatedTime = common.GetTimestamp()
	return DB.Save(d).Error
}

func IsDeptCodeDuplicated(orgId int, excludeId int, code string) (bool, error) {
	if code == "" {
		return false, nil
	}
	var cnt int64
	err := DB.Model(&Department{}).Where("organization_id = ? AND code = ? AND id <> ?", orgId, code, excludeId).Count(&cnt).Error
	return cnt > 0, err
}

func GetDepartmentByID(id int) (*Department, error) {
	var d Department
	err := DB.First(&d, id).Error
	if err != nil {
		return nil, err
	}
	return &d, nil
}

func GetDepartmentsByOrgID(orgId int, offset int, limit int) ([]*Department, int64, error) {
	db := DB.Model(&Department{})
	if orgId > 0 {
		db = db.Where("organization_id = ?", orgId)
	}
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var depts []*Department
	if err := db.Offset(offset).Limit(limit).Order("sort ASC, id DESC").Find(&depts).Error; err != nil {
		return nil, 0, err
	}
	return depts, total, nil
}

func GetChildDepartments(parentId int) ([]*Department, error) {
	var depts []*Department
	err := DB.Where("parent_id = ?", parentId).Order("sort ASC, id DESC").Find(&depts).Error
	return depts, err
}

type DepartmentTreeNode struct {
	Department
	Children []*DepartmentTreeNode `json:"children,omitempty"`
}

func GetDepartmentTree(orgId int) ([]*DepartmentTreeNode, error) {
	var allDepts []*Department
	err := DB.Where("organization_id = ?", orgId).Order("sort ASC, id ASC").Find(&allDepts).Error
	if err != nil {
		return nil, err
	}

	// Build tree in memory
	nodeMap := make(map[int]*DepartmentTreeNode)
	var roots []*DepartmentTreeNode

	for i := range allDepts {
		node := &DepartmentTreeNode{Department: *allDepts[i], Children: make([]*DepartmentTreeNode, 0)}
		nodeMap[allDepts[i].Id] = node
	}

	for _, node := range nodeMap {
		if node.ParentId == 0 {
			roots = append(roots, node)
		} else if parent, ok := nodeMap[node.ParentId]; ok {
			parent.Children = append(parent.Children, node)
		} else {
			roots = append(roots, node)
		}
	}

	return roots, nil
}

func SearchDepartments(keyword string, orgId int, offset int, limit int) ([]*Department, int64, error) {
	db := DB.Model(&Department{})
	if orgId > 0 {
		db = db.Where("organization_id = ?", orgId)
	}
	if keyword != "" {
		like := "%" + keyword + "%"
		db = db.Where("name LIKE ? OR code LIKE ? OR description LIKE ?", like, like, like)
	}
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var depts []*Department
	if err := db.Offset(offset).Limit(limit).Order("sort ASC, id DESC").Find(&depts).Error; err != nil {
		return nil, 0, err
	}
	return depts, total, nil
}

func DeleteDepartmentByID(id int) error {
	return DB.Delete(&Department{Id: id}).Error
}

// GetDepartmentsByIds returns departments by a list of IDs
func GetDepartmentsByIds(ids []int) ([]*Department, error) {
	if len(ids) == 0 {
		return nil, nil
	}
	var depts []*Department
	err := DB.Where("id IN ?", ids).Find(&depts).Error
	return depts, err
}
